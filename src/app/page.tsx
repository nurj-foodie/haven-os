'use client';
import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/Sidebar';
import Canvas from '@/components/Canvas';
import { Sparkles, Calendar } from 'lucide-react';
import CalendarPanel from '@/components/CalendarPanel';
import { categorizeItem } from './actions';

import { Node } from '@xyflow/react';
import Inspector from '@/components/Inspector';

interface Asset {
  id: string;
  public_url: string;
  filename: string;
  type: string;
  storage_path?: string;
}

interface StagingItem {
  id: string;
  type: 'text' | 'link' | 'file';
  content: string | null;
  asset_id: string | null;
  metadata: any;
  created_at: string;
  lifecycle_state?: 'fresh' | 'aging' | 'archived';
  archived_at?: string;
  last_interacted_at?: string;
  asset?: Asset;
}

interface ArchivedItem {
  id: string;
  user_id: string;
  original_staging_id: string;
  type: 'text' | 'link' | 'file';
  content: string | null;
  asset_id: string | null;
  metadata: any;
  created_at: string;
  archived_at: string;
  asset?: Asset;
}

import { ReactFlowProvider } from '@xyflow/react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function HavenOS() {
  return (
    <ReactFlowProvider>
      <ErrorBoundary>
        <HavenOSContent />
      </ErrorBoundary>
    </ReactFlowProvider>
  );
}

function HavenOSContent() {
  const [user, setUser] = useState<User | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [stagingItems, setStagingItems] = useState<StagingItem[]>([]);
  const [archivedItems, setArchivedItems] = useState<ArchivedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedNodes, setSelectedNodes] = useState<Node[]>([]);
  const [deletedAssetId, setDeletedAssetId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  // 2. FETCH DATA
  const fetchAssets = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) console.error("Fetch Assets Error:", error);
      else setAssets(data || []);
    } catch (e) { console.warn("Offline: Fetch assets failed"); }
  };

  const fetchStagingItems = async (userId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('staging_items')
        .select(`
            *,
            asset:assets(*)
        `)
        .eq('user_id', userId)
        .eq('is_categorized', false)
        .neq('lifecycle_state', 'archived')
        .order('created_at', { ascending: true }); // Chat order

      if (error) {
        console.error("Fetch Staging Error:", error);
      } else {
        setStagingItems(data || []);
      }
    } catch (e) {
      console.warn("Offline: Fetch staging failed");
    } finally {
      setLoading(false);
    }
  };

  const fetchArchivedItems = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('archived_items')
        .select(`
            *,
            asset:assets(*)
        `)
        .eq('user_id', userId)
        .order('archived_at', { ascending: false });

      if (error) {
        console.error("Fetch Archived Error:", error);
      } else {
        setArchivedItems(data || []);
      }
    } catch (e) {
      console.warn("Offline: Fetch archived failed");
    }
  };

  const handleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      if (error) alert("Login Error: " + error.message);
    } catch (e) { console.warn("Offline: Login skipped"); }
  };

  const handleLogout = async () => {
    try { await supabase.auth.signOut(); } catch (e) { }
  };

  // 3. UPLOAD LOGIC (BUCKET -> DB)
  const handleUpload = async (file: File) => {
    if (!user) return;

    try {
      // File size validation (50MB limit for free tier, 5GB for paid)
      const maxSize = 50 * 1024 * 1024; // 50MB in bytes
      if (file.size > maxSize) {
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
        alert(`File too large: ${fileSizeMB}MB. Maximum size is 50MB.\n\nFor large video files:\n1. Use a video compressor\n2. Or upgrade Supabase plan for larger uploads`);
        return;
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      // A. Upload to Supabase Storage ('vault')
      const { error: uploadError } = await supabase.storage
        .from('vault')
        .upload(filePath, file, {
          contentType: file.type,
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        if (uploadError.message.includes('row-level security')) {
          alert('Storage permission error. Please check Supabase RLS policies.');
        } else if (uploadError.message.includes('size')) {
          alert('File size exceeds storage limits.');
        } else {
          alert(`Upload failed: ${uploadError.message}`);
        }
        throw uploadError;
      }

      // B. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('vault')
        .getPublicUrl(filePath);

      // C. Record in DB ('assets')
      // Better type detection using both MIME and extension
      const fileExtLower = fileExt?.toLowerCase() || '';
      let assetType = 'document'; // default

      // Check MIME type first
      if (file.type.startsWith('image/')) {
        assetType = 'image';
      } else if (file.type.startsWith('video/')) {
        assetType = 'video';
      } else if (file.type.startsWith('audio/')) {
        assetType = 'audio';
      }
      // Fallback: Check file extension for misdetected types
      else if (['m4a', 'mp3', 'wav', 'ogg', 'flac', 'aac', 'wma', 'aiff', 'oga'].includes(fileExtLower)) {
        assetType = 'audio';
        console.log(`[Upload] Audio file detected by extension: ${fileExtLower}, MIME: ${file.type}`);
      } else if (['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv', 'm4v'].includes(fileExtLower)) {
        assetType = 'video';
        console.log(`[Upload] Video file detected by extension: ${fileExtLower}, MIME: ${file.type}`);
      }

      console.log(`[Upload] File: ${file.name}, Type: ${assetType}, MIME: ${file.type}, Ext: ${fileExtLower}`);

      // C. Insert into assets table
      const { data: assetData, error: assetError } = await supabase
        .from('assets')
        .insert({
          user_id: user.id,
          type: assetType,
          filename: file.name,
          storage_path: filePath,
          public_url: publicUrl,
          metadata: {}
        })
        .select()
        .single();

      if (assetError) throw assetError;

      // D. Create Staging Item
      const { error: stagingError } = await supabase
        .from('staging_items')
        .insert({
          user_id: user.id,
          type: 'file',
          asset_id: assetData.id,
          is_categorized: false
        });

      if (stagingError) throw stagingError;

      // E. Refresh
      fetchStagingItems(user.id);

    } catch (error) {
      console.error("Upload Logic Error:", error);
      // Alert already shown above for specific errors
    }
  };

  const handleSendText = async (text: string) => {
    if (!user) return;

    const isLink = text.startsWith('http://') || text.startsWith('https://');

    const { error } = await supabase
      .from('staging_items')
      .insert({
        user_id: user.id,
        type: isLink ? 'link' : 'text',
        content: text,
        is_categorized: false
      });

    if (error) {
      console.error("Send Text Error:", error);
    } else {
      fetchStagingItems(user.id);
    }
  };

  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const handleCategorize = async (itemId: string) => {
    if (!user) return;
    const item = stagingItems.find(i => i.id === itemId);
    if (!item) return;

    // Set loading state in metadata
    setStagingItems(prev => prev.map(i =>
      i.id === itemId ? { ...i, metadata: { ...i.metadata, is_categorizing: true } } : i
    ));

    const result = await categorizeItem(item);

    if (result.success) {
      const { error } = await supabase
        .from('staging_items')
        .update({ metadata: { ...item.metadata, ai_suggestion: result.data, is_categorizing: false } })
        .eq('id', itemId);

      if (error) console.error("Update Suggestions Error:", error);
      fetchStagingItems(user.id);
    } else {
      setStagingItems(prev => prev.map(i =>
        i.id === itemId ? { ...i, metadata: { ...i.metadata, is_categorizing: false } } : i
      ));
      alert("Categorization failed: " + result.error);
    }
  };

  const handleMoveToVault = async (itemId: string, suggestion: any) => {
    if (!user) return;
    const item = stagingItems.find(i => i.id === itemId);
    if (!item) return;

    try {
      let finalAssetId: string;

      // Create searchable text for embedding
      const searchableText = [
        suggestion.title || '',
        suggestion.summary || '',
        (suggestion.tags || []).join(' '),
        item.content || ''
      ].filter(Boolean).join(' ').substring(0, 2000);

      let embedding: number[] | null = null;
      try {
        const embedResponse = await fetch('/api/embed', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: searchableText })
        });
        if (embedResponse.ok) {
          const embedData = await embedResponse.json();
          embedding = embedData.embedding;
        }
      } catch (embedError) {
        console.warn('[Vault] Embedding generation failed, continuing without:', embedError);
      }

      if (item.asset_id) {
        // For existing assets (file uploads), preserve the original type if it's audio/video
        // because AI might incorrectly categorize them as 'note' or other types
        const { data: existingAsset } = await supabase
          .from('assets')
          .select('type')
          .eq('id', item.asset_id)
          .single();

        const shouldPreserveType = existingAsset?.type === 'audio' || existingAsset?.type === 'video';

        const updatePayload: any = {
          type: shouldPreserveType ? existingAsset.type : suggestion.category,
          filename: suggestion.title,
          metadata: {
            summary: suggestion.summary,
            tags: suggestion.tags,
            original_staging_id: itemId,
            raw_content: item.content
          }
        };
        if (embedding) {
          updatePayload.embedding = `[${embedding.join(',')}]`;
        }

        const { error: updateError } = await supabase
          .from('assets')
          .update(updatePayload)
          .eq('id', item.asset_id);

        if (updateError) throw updateError;
        finalAssetId = item.asset_id;
      } else {
        const insertPayload: any = {
          user_id: user.id,
          type: suggestion.category,
          filename: suggestion.title,
          storage_path: null,
          public_url: null,
          metadata: {
            summary: suggestion.summary,
            tags: suggestion.tags,
            original_staging_id: itemId,
            raw_content: item.content
          }
        };
        if (embedding) {
          insertPayload.embedding = `[${embedding.join(',')}]`;
        }

        const { data: assetData, error: assetError } = await supabase
          .from('assets')
          .insert(insertPayload)
          .select()
          .single();

        if (assetError) throw assetError;
        finalAssetId = assetData.id;
      }

      const { error: stagingError } = await supabase
        .from('staging_items')
        .update({
          is_categorized: true,
          categorized_at: new Date().toISOString(),
          asset_id: finalAssetId
        })
        .eq('id', itemId);

      if (stagingError) throw stagingError;

      fetchAssets(user.id);
      fetchStagingItems(user.id);

    } catch (error: any) {
      console.error("Move to Vault Error:", error);
      alert("Failed to move to vault: " + error.message);
    }
  };

  const handleCategorizeAll = async () => {
    if (!user || stagingItems.length === 0) return;
    const pending = stagingItems.filter(i => !i.metadata?.ai_suggestion);
    for (const item of pending) {
      await handleCategorize(item.id);
    }
  };

  const handleDeleteAsset = async (assetId: string) => {
    if (!user || isDeleting) return;
    const asset = assets.find(a => a.id === assetId);
    if (!asset) return;
    setPendingDeleteId(assetId);
  };

  const confirmDelete = async () => {
    if (!pendingDeleteId || !user) return;
    const asset = assets.find(a => a.id === pendingDeleteId);
    if (!asset) return;

    setIsDeleting(true);
    setPendingDeleteId(null);

    try {
      if (asset.storage_path) {
        const { error: storageError } = await supabase.storage
          .from('vault')
          .remove([asset.storage_path]);
        if (storageError) console.error("Storage Delete Error:", storageError);
      }

      const { error } = await supabase
        .from('assets')
        .delete()
        .eq('id', pendingDeleteId);

      if (error) {
        throw error;
      }

      setDeletedAssetId(pendingDeleteId);
      setTimeout(() => setDeletedAssetId(null), 100);

      fetchAssets(user.id);
    } catch (error: any) {
      alert("Delete failed: " + error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDelete = () => {
    setPendingDeleteId(null);
    setIsDeleting(false);
  };

  const handleDeleteStagingItem = async (itemId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('staging_items')
      .delete()
      .eq('id', itemId);

    if (error) console.error("Delete Staging Error:", error);
    else fetchStagingItems(user.id);
  };

  const handleArchiveItem = async (itemId: string) => {
    if (!user) return;
    const item = stagingItems.find(i => i.id === itemId);
    if (!item) return;

    try {
      // Insert into archived_items
      const { error: insertError } = await supabase
        .from('archived_items')
        .insert({
          user_id: user.id,
          original_staging_id: item.id,
          type: item.type,
          content: item.content,
          asset_id: item.asset_id,
          metadata: item.metadata,
          created_at: item.created_at,
        });

      if (insertError) throw insertError;

      // Update staging item to archived state
      const { error: updateError } = await supabase
        .from('staging_items')
        .update({
          lifecycle_state: 'archived',
          archived_at: new Date().toISOString()
        })
        .eq('id', itemId);

      if (updateError) throw updateError;

      fetchStagingItems(user.id);
      if (showArchive) fetchArchivedItems(user.id);
    } catch (error: any) {
      console.error("Archive Error:", error);
      alert("Failed to archive item: " + error.message);
    }
  };

  const handleRestoreFromArchive = async (archivedId: string) => {
    if (!user) return;
    const archived = archivedItems.find(i => i.id === archivedId);
    if (!archived || !archived.original_staging_id) return;

    try {
      // Update original staging item back to fresh
      const { error: updateError } = await supabase
        .from('staging_items')
        .update({
          lifecycle_state: 'fresh',
          archived_at: null,
          last_interacted_at: new Date().toISOString()
        })
        .eq('id', archived.original_staging_id);

      if (updateError) throw updateError;

      // Delete from archived_items
      const { error: deleteError } = await supabase
        .from('archived_items')
        .delete()
        .eq('id', archivedId);

      if (deleteError) throw deleteError;

      fetchStagingItems(user.id);
      fetchArchivedItems(user.id);
    } catch (error: any) {
      console.error("Restore Error:", error);
      alert("Failed to restore item: " + error.message);
    }
  };

  const handleNodesDelete = async (deletedNodes: Node[]) => {
    if (!user) return;
    console.log(`[Canvas] Nodes deleted:`, deletedNodes);

    for (const node of deletedNodes) {
      const assetId = node.data.assetId as string;
      console.log(`[Canvas] Checking node for assetId:`, node.id, assetId);
      if (assetId) {
        await handleDeleteAsset(assetId);
      }
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        setUser(session?.user ?? null);
        if (session?.user) {
          // Trigger lifecycle sync on mount
          await fetch('/api/lifecycle', { method: 'POST' });
          fetchAssets(session.user.id);
        }
      } catch (e) {
        console.log("Supabase Offline or Error:", e);
        // Don't block UI
      }
    };
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchAssets(session.user.id);
        fetchStagingItems(session.user.id);
      } else {
        setAssets([]);
        setStagingItems([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);
  // ... (rest of the component logic)
  return (
    <main className="flex h-screen w-screen bg-[#020617] text-slate-200 overflow-hidden font-sans">

      {/* 1. LEFT SIDEBAR (THE VAULT) */}
      <Sidebar
        user={user}
        loading={loading}
        assets={assets}
        stagingItems={stagingItems}
        archivedItems={archivedItems}
        showArchive={showArchive}
        onLogin={handleLogin}
        onUpload={handleUpload}
        onSendText={handleSendText}
        onCategorizeItem={handleCategorize}
        onMoveToVault={handleMoveToVault}
        onCategorizeAll={handleCategorizeAll}
        onDeleteAsset={handleDeleteAsset}
        onDeleteStagingItem={handleDeleteStagingItem}
        onArchiveItem={handleArchiveItem}
        onRestoreFromArchive={handleRestoreFromArchive}
        onToggleArchive={(show) => {
          setShowArchive(show);
          if (show && user) fetchArchivedItems(user.id);
        }}
      />

      {/* 2. CENTER STAGE (THE CANVAS) */}
      <div className="flex-1 relative flex flex-col">
        {/* Top Bar / Status */}
        <div className="h-12 border-b border-slate-800 bg-[#020617] flex items-center justify-between px-4 z-10">
          <div className="text-xs font-mono text-slate-500">HAVEN OS v1.0 <span className="text-yellow-500/50">// FORTRESS</span></div>
          <div className="flex items-center gap-4">
            {/* Calendar Button */}
            <button
              onClick={() => setShowCalendar(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg text-amber-400 text-xs font-bold transition-all"
              title="Content Calendar"
            >
              <Calendar className="w-3.5 h-3.5" />
              Calendar
            </button>
            {user && (
              <button onClick={handleLogout} className="text-[10px] text-red-400 hover:text-red-300 uppercase tracking-wider">Disconnect</button>
            )}
          </div>
        </div>

        <div className="flex-1 relative">
          <Canvas
            onSelectionChange={setSelectedNodes}
            onNodesDelete={handleNodesDelete}
            deletedAssetId={deletedAssetId}
          />
        </div>
      </div>

      {/* 3. RIGHT SIDEBAR (THE INSPECTOR) */}
      <Inspector selectedNodes={selectedNodes} />

      {/* CALENDAR PANEL */}
      <CalendarPanel
        isOpen={showCalendar}
        onClose={() => setShowCalendar(false)}
        userId={user?.id}
      />

      {/* DELETE CONFIRMATION MODAL */}
      {pendingDeleteId && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 max-w-md mx-4 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-200 mb-2">Delete Asset?</h3>
            <p className="text-sm text-slate-400 mb-6">
              This will permanently delete this asset from your Vault. This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={cancelDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-500 hover:bg-red-400 text-white rounded transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
