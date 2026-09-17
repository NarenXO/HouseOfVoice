import React, { useState, useEffect, useRef } from 'react';

interface SmartboardProps {
  ws: WebSocket | null;
  roomId: string;
  clientId: string;
}

interface Sticker {
  sticker: 'star' | 'check' | 'thumbs';
  x: number;
  y: number;
}


interface Cursor {
  sender: string;
  x: number;
  y: number;
}

export default function Smartboard({ ws, roomId, clientId }: SmartboardProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef<boolean>(false);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);

  // Tools & State
  const [tool, setTool] = useState<'pen' | 'eraser' | 'text' | 'sticker'>('pen');
  const [color, setColor] = useState<string>('#0f172a'); // Default Black
  const [lineWidth, setLineWidth] = useState<number>(5);
  const [activeSticker, setActiveSticker] = useState<'star' | 'check' | 'thumbs'>('star');
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [template, setTemplate] = useState<'blank' | 'mouth' | 'alphabet' | 'pacing'>('blank');

  // Turn management
  const [activeDrawerId, setActiveDrawerId] = useState<string>(clientId);
  const isMyTurn = activeDrawerId === clientId;

  // Live cursors
  const [cursors, setCursors] = useState<Record<string, Cursor>>({});



  // 1. High-DPI Canvas Resizing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const width = parent.clientWidth;
    const height = Math.max(480, Math.floor(width * 0.62));

    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
  }, []);

  // 2. Handle Real-Time WebSocket Events
  useEffect(() => {
    if (!ws) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const w = canvas.clientWidth;
        const h = canvas.clientHeight;

        switch (data.type) {
          case 'draw_start':
            ctx.beginPath();
            ctx.strokeStyle = data.color;
            ctx.lineWidth = data.width;
            ctx.globalCompositeOperation = data.tool === 'eraser' ? 'destination-out' : 'source-over';
            ctx.moveTo(data.x * w, data.y * h);
            break;

          case 'draw_move':
            ctx.lineTo(data.x * w, data.y * h);
            ctx.stroke();
            break;

          case 'draw_end':
            ctx.closePath();
            break;

          case 'add_text':
            ctx.globalCompositeOperation = 'source-over';
            ctx.font = 'bold 22px sans-serif';
            ctx.textBaseline = 'top'; // Top-left aligned to click point
            ctx.textAlign = 'left';
            ctx.fillStyle = data.color || '#0f172a';
            ctx.fillText(data.text, data.x * w, data.y * h);
            break;

          case 'clear_canvas':
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            setStickers([]);
            break;

          case 'add_sticker':
            setStickers((prev) => [...prev, { sticker: data.sticker, x: data.x, y: data.y }]);
            break;

          case 'remove_sticker':
            setStickers((prev) => prev.filter((_, idx) => idx !== data.index));
            break;

          case 'turn_change':
            setActiveDrawerId(data.activeDrawerId);
            break;

          case 'template_change':
            setTemplate(data.templateId);
            break;

          case 'tile_move':
            setTiles((prev) =>
              prev.map((t) => (t.id === data.tileId ? { ...t, x: data.x, y: data.y } : t))
            );
            break;

          case 'reset_tiles':
            setTiles(defaultTiles);
            break;

          case 'cursor_move':
            setCursors((prev) => ({
              ...prev,
              [data.sender]: { sender: data.sender, x: data.x, y: data.y },
            }));
            break;

          default:
            break;
        }
      } catch (err) {
        console.error('Failed to parse WS message:', err);
      }
    };

    ws.addEventListener('message', handleMessage);
    return () => ws.removeEventListener('message', handleMessage);
  }, [ws]);

  // 3. Canvas Mouse / Touch Coordinates
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0, normX: 0, normY: 0 };
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    return { x, y, normX: x / rect.width, normY: y / rect.height };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isMyTurn) return;
    const { x, y, normX, normY } = getCanvasCoords(e);

    if (tool === 'sticker') {
      const newSticker: Sticker = { sticker: activeSticker, x: normX, y: normY };
      setStickers((prev) => [...prev, newSticker]);
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'add_sticker', sticker: activeSticker, x: normX, y: normY }));
      }
      return;
    }

    if (tool === 'text') {
      const text = prompt('Enter text to insert on board:');
      if (text) {
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.globalCompositeOperation = 'source-over';
            ctx.font = 'bold 22px sans-serif';
            ctx.textBaseline = 'top'; // Exactly aligns top-left of text to click position
            ctx.textAlign = 'left';
            ctx.fillStyle = color || '#0f172a';
            ctx.fillText(text, x, y);
            if (ws && ws.readyState === WebSocket.OPEN) {
              ws.send(
                JSON.stringify({
                  type: 'add_text',
                  x: normX,
                  y: normY,
                  text,
                  color: color || '#0f172a',
                })
              );
            }
          }
        }
      }
      return;
    }

    isDrawingRef.current = true;
    lastPosRef.current = { x, y };

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
        ctx.moveTo(x, y);
      }
    }

    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          type: 'draw_start',
          x: normX,
          y: normY,
          color,
          width: lineWidth,
          tool,
        })
      );
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y, normX, normY } = getCanvasCoords(e);

    // Live cursor tracking
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'cursor_move', sender: clientId, x: normX, y: normY }));
    }

    if (!isDrawingRef.current || !isMyTurn) return;

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineTo(x, y);
        ctx.stroke();
      }
    }

    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'draw_move', x: normX, y: normY }));
    }
  };

  const handleMouseUp = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.closePath();
    }

    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'draw_end' }));
    }
  };

  // Clear Canvas (Clears drawings AND stickers state)
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setStickers([]);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'clear_canvas' }));
    }
  };

  // Remove Individual Sticker
  const removeSticker = (indexToRemove: number) => {
    setStickers((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'remove_sticker', index: indexToRemove }));
    }
  };

  // Pass Turn
  const toggleTurn = () => {
    const nextDrawer = isMyTurn ? 'peer' : clientId;
    setActiveDrawerId(nextDrawer);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'turn_change', activeDrawerId: nextDrawer }));
    }
  };

  // Reset Tiles
  const resetTiles = () => {
    setTiles(defaultTiles);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'reset_tiles' }));
    }
  };

  // Save Snapshot
  const saveSnapshot = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `smartboard-snapshot-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  // Emoji Reaction Burst
  const sendReaction = (emoji: string) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'reaction', emoji }));
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-white rounded-xl p-3 border border-slate-700 shadow-xl overflow-hidden relative">
      {/* Top Controls Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 bg-slate-800 p-2 rounded-lg border border-slate-700">
        <div className="flex items-center gap-2">
          {/* Turn Indicator */}
          <button
            onClick={toggleTurn}
            className={`px-3 py-1 rounded-full text-xs font-bold transition flex items-center gap-1 ${
              isMyTurn
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
            }`}
          >
            {isMyTurn ? '✏️ Your Turn to Draw' : '👀 Observing (Peer Turn)'}
          </button>

          {/* Template Selector */}
          <select
            value={template}
            onChange={(e) => {
              const t = e.target.value as any;
              setTemplate(t);
              if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'template_change', templateId: t }));
              }
            }}
            className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs"
          >
            <option value="blank">Template: Blank</option>
            <option value="mouth">Template: Mouth Anatomy</option>
            <option value="alphabet">Template: Alphabet Grid</option>
            <option value="pacing">Template: Pacing Line (1-10)</option>
          </select>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">

          <button
            onClick={clearCanvas}
            className="bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded text-xs font-semibold"
          >
            Clear Board
          </button>
          <button
            onClick={saveSnapshot}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1 rounded text-xs font-semibold"
          >
            Save Snapshot
          </button>
        </div>
      </div>

      {/* Tool Options Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2 bg-slate-800/60 p-2 rounded border border-slate-700 text-xs">
        <div className="flex items-center gap-2">
          {/* Pen / Eraser / Text / Sticker Selectors */}
          <button
            onClick={() => setTool('pen')}
            className={`px-2.5 py-1 rounded ${tool === 'pen' ? 'bg-indigo-600 font-bold' : 'bg-slate-700'}`}
          >
            ✏️ Pen
          </button>
          <button
            onClick={() => setTool('eraser')}
            className={`px-2.5 py-1 rounded ${tool === 'eraser' ? 'bg-indigo-600 font-bold' : 'bg-slate-700'}`}
          >
            🧹 Eraser
          </button>
          <button
            onClick={() => setTool('text')}
            className={`px-2.5 py-1 rounded ${tool === 'text' ? 'bg-indigo-600 font-bold' : 'bg-slate-700'}`}
          >
            🔤 Text
          </button>
          <button
            onClick={() => setTool('sticker')}
            className={`px-2.5 py-1 rounded ${tool === 'sticker' ? 'bg-indigo-600 font-bold' : 'bg-slate-700'}`}
          >
            ⭐ Sticker
          </button>

          {/* Color Palette (Visible for both Pen AND Text tool) */}
          {(tool === 'pen' || tool === 'text') && (
            <div className="flex items-center gap-1.5 ml-2 border-l border-slate-700 pl-2">
              <span className="text-[10px] text-slate-400">Color:</span>
              {['#0f172a', '#ef4444', '#3b82f6', '#10b981', '#f59e0b'].map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  style={{ backgroundColor: c }}
                  className={`w-5 h-5 rounded-full border ${color === c ? 'ring-2 ring-white scale-110' : 'border-slate-600'}`}
                />
              ))}
            </div>
          )}

          {/* Stroke Widths (Pen only) */}
          {tool === 'pen' && (
            <div className="flex items-center gap-1 ml-2 border-l border-slate-700 pl-2">
              {[
                { label: 'Fine', width: 2 },
                { label: 'Medium', width: 5 },
                { label: 'Thick', width: 10 },
              ].map((sw) => (
                <button
                  key={sw.label}
                  onClick={() => setLineWidth(sw.width)}
                  className={`px-2 py-0.5 rounded text-[11px] ${
                    lineWidth === sw.width ? 'bg-indigo-600 font-bold' : 'bg-slate-700'
                  }`}
                >
                  {sw.label}
                </button>
              ))}
            </div>
          )}

          {/* Sticker Selector */}
          {tool === 'sticker' && (
            <div className="flex items-center gap-1.5 ml-2 border-l border-slate-700 pl-2">
              <button
                onClick={() => setActiveSticker('star')}
                className={`p-1 rounded text-sm ${activeSticker === 'star' ? 'bg-indigo-600 scale-110' : ''}`}
              >
                ⭐
              </button>
              <button
                onClick={() => setActiveSticker('check')}
                className={`p-1 rounded text-sm ${activeSticker === 'check' ? 'bg-indigo-600 scale-110' : ''}`}
              >
                ✅
              </button>
              <button
                onClick={() => setActiveSticker('thumbs')}
                className={`p-1 rounded text-sm ${activeSticker === 'thumbs' ? 'bg-indigo-600 scale-110' : ''}`}
              >
                👍
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Canvas Workspace */}
      <div className="relative flex-1 bg-white rounded-lg overflow-hidden border border-slate-700 min-h-[420px]">
        {/* Template Background Overlay */}
        {template === 'mouth' && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-25">
            <svg viewBox="0 0 400 400" className="w-full h-full max-w-md">
              <path d="M 100 150 C 150 100, 250 100, 300 150" fill="none" stroke="#e11d48" strokeWidth="8" />
              <path d="M 100 250 C 150 300, 250 300, 300 250" fill="none" stroke="#e11d48" strokeWidth="8" />
              <path d="M 150 200 Q 200 160 250 200" fill="none" stroke="#f43f5e" strokeWidth="12" />
            </svg>
          </div>
        )}

        {template === 'alphabet' && (
          <div className="absolute inset-0 pointer-events-none grid grid-cols-6 gap-2 p-4 opacity-20 font-bold text-slate-800 text-lg">
            {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'].map(
              (l) => (
                <div key={l} className="border border-slate-400 rounded flex items-center justify-center">
                  {l}
                </div>
              )
            )}
          </div>
        )}

        {template === 'pacing' && (
          <div className="absolute inset-x-4 top-1/2 transform -translate-y-1/2 pointer-events-none flex justify-between items-center opacity-30">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
              <div key={n} className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-sm">
                {n}
              </div>
            ))}
          </div>
        )}

        {/* Drawing Canvas */}
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className={`absolute inset-0 w-full h-full ${
            tool === 'text' ? 'cursor-text' : tool === 'sticker' ? 'cursor-pointer' : 'cursor-crosshair'
          }`}
        />

        {/* Rendered Interactive Stickers (Clicking sticker removes it) */}
        {stickers.map((s, idx) => (
          <div
            key={idx}
            onClick={(e) => {
              e.stopPropagation();
              removeSticker(idx);
            }}
            style={{ left: `${s.x * 100}%`, top: `${s.y * 100}%` }}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 text-3xl cursor-pointer hover:scale-125 transition-transform bg-white/80 dark:bg-slate-800/80 p-1.5 rounded-full shadow-md select-none group border border-slate-300 dark:border-slate-600 z-10"
            title="Click to remove sticker"
          >
            <span>{s.sticker === 'star' ? '⭐' : s.sticker === 'check' ? '✅' : '👍'}</span>
            <span className="hidden group-hover:flex absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 text-[10px] items-center justify-center font-bold">
              ×
            </span>
          </div>
        ))}



        {/* Floating Remote Cursors (Crisp Black pointer dot) */}
        {Object.values(cursors).map((c) => (
          <div
            key={c.sender}
            style={{ left: `${c.x * 100}%`, top: `${c.y * 100}%` }}
            className="absolute pointer-events-none transform -translate-x-1/2 -translate-y-1/2 flex items-center gap-1 z-20"
          >
            <div className="w-3.5 h-3.5 bg-slate-950 border-2 border-white rounded-full shadow-md animate-pulse" />
            <span className="bg-slate-900 text-white text-[10px] px-1.5 py-0.5 rounded opacity-90 font-mono shadow border border-slate-700">
              {c.sender}
            </span>
          </div>
        ))}
      </div>

      {/* Floating Emoji Reactions Bar */}
      <div className="mt-3 flex items-center justify-between bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
        <span className="text-xs text-slate-400">Quick Reactions:</span>
        <div className="flex gap-3">
          {['🎉', '💖', '👏', '✨', '🔥'].map((emoji) => (
            <button
              key={emoji}
              onClick={() => sendReaction(emoji)}
              className="text-lg hover:scale-125 transition-transform"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
