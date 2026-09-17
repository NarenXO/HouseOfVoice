import { useEffect, useRef, useState } from "react";
import PhonemeVisualizer from "./PhonemeVisualizer";

interface SmartboardProps {
  ws: WebSocket | null;
  roomId: string;
  clientId: string;
  onSnapshotCapture?: (snapshotData: string) => void;
}

interface RemoteCursor {
  x: number;
  y: number;
  sender: string;
}

interface LetterTile {
  id: string;
  letter: string;
  x: number;
  y: number;
  inTray: boolean;
}

interface Sticker {
  id: string;
  type: "star" | "check" | "thumbs";
  x: number;
  y: number;
}

interface Flashcard {
  emoji: string;
  word: string;
  phonetic: string;
  cue: string;
}

interface MatchItem {
  id: string;
  emoji: string;
  word: string;
  matched: boolean;
}

interface Reaction {
  emoji: string;
  id: number;
  progress: number;
}

interface WSMessage {
  type: string;
  [key: string]: any;
}

type Tool = "pen" | "eraser" | "text" | "sticker";
type Template = "blank" | "mouth" | "alphabet" | "pacing";

const COLORS = {
  black: "#0f172a",
  red: "#ef4444",
  blue: "#3b82f6",
  green: "#10b981",
  amber: "#f59e0b",
};

const STROKE_WIDTHS = {
  fine: 2,
  medium: 5,
  thick: 10,
};

const FLASHCARDS: Flashcard[] = [
  { emoji: "🐰", word: "Rabbit", phonetic: "/r/", cue: "Initial position" },
  { emoji: "☀️", word: "Sun", phonetic: "/s/", cue: "Initial position" },
  { emoji: "👍", word: "Thumb", phonetic: "/th/", cue: "Voiceless" },
  { emoji: "🦷", word: "Teeth", phonetic: "/th/", cue: "Voiced" },
  { emoji: "🌈", word: "Rainbow", phonetic: "/r/", cue: "Initial blend" },
  { emoji: "🐍", word: "Snake", phonetic: "/s/", cue: "Initial position" },
];

const LETTERS = ["R", "S", "T", "L", "A", "E", "I", "O", "U", "P", "B", "N", "M", "D", "G"];

export default function Smartboard({ ws, roomId, clientId, onSnapshotCapture }: SmartboardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<Tool>("pen");
  const [color, setColor] = useState(COLORS.black);
  const [strokeWidth, setStrokeWidth] = useState(STROKE_WIDTHS.medium);
  const [activeDrawerId, setActiveDrawerId] = useState<string>(clientId);
  const [remoteCursors, setRemoteCursors] = useState<Record<string, RemoteCursor>>({});
  const [textInput, setTextInput] = useState("");
  const [textPosition, setTextPosition] = useState<{ x: number; y: number } | null>(null);
  const [isMyTurn, setIsMyTurn] = useState(true);
  
  // Phase 3 state
  const [template, setTemplate] = useState<Template>("blank");
  const [letterTiles, setLetterTiles] = useState<LetterTile[]>([]);
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [selectedSticker, setSelectedSticker] = useState<"star" | "check" | "thumbs" | null>(null);
  const [showFlashcards, setShowFlashcards] = useState(false);
  const [currentFlashcard, setCurrentFlashcard] = useState(0);
  const [showMatching, setShowMatching] = useState(false);
  const [matchItems, setMatchItems] = useState<MatchItem[]>([]);
  const [selectedMatchItem, setSelectedMatchItem] = useState<string | null>(null);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  
  // Phase 4 state
  const [showPhonemeVisualizer, setShowPhonemeVisualizer] = useState(false);
  const [activePhoneme, setActivePhoneme] = useState<string>("/r/");
  const [activeAnatomyAssets, setActiveAnatomyAssets] = useState<string[]>([]);

  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const canvasBackgroundRef = useRef<HTMLCanvasElement>(null);

  // Initialize letter tiles
  useEffect(() => {
    const tiles: LetterTile[] = LETTERS.map((letter, index) => ({
      id: `tile-${index}`,
      letter,
      x: 0.05 + (index % 7) * 0.13,
      y: 0.85 + Math.floor(index / 7) * 0.12,
      inTray: true,
    }));
    setLetterTiles(tiles);
  }, []);

  // Initialize match items
  useEffect(() => {
    const items: MatchItem[] = [
      { id: "1", emoji: "🐰", word: "Rabbit", matched: false },
      { id: "2", emoji: "☀️", word: "Sun", matched: false },
      { id: "3", emoji: "👍", word: "Thumb", matched: false },
    ];
    setMatchItems(items);
  }, []);

  // Draw template background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !ctxRef.current) return;

    const rect = canvas.getBoundingClientRect();
    ctxRef.current.fillStyle = "#ffffff";
    ctxRef.current.fillRect(0, 0, rect.width, rect.height);

    drawTemplate(template, rect.width, rect.height);
  }, [template]);

  const drawTemplate = (templateType: Template, width: number, height: number) => {
    if (!ctxRef.current) return;
    const ctx = ctxRef.current;

    switch (templateType) {
      case "mouth":
        drawMouthTemplate(ctx, width, height);
        break;
      case "alphabet":
        drawAlphabetTemplate(ctx, width, height);
        break;
      case "pacing":
        drawPacingTemplate(ctx, width, height);
        break;
      case "blank":
        // Already filled with white
        break;
    }
  };

  const drawMouthTemplate = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.save();
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 2;
    ctx.fillStyle = "#fef3c7";

    // Head outline
    ctx.beginPath();
    ctx.ellipse(width / 2, height / 2, width * 0.3, height * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Lips
    ctx.fillStyle = "#fca5a5";
    ctx.beginPath();
    ctx.ellipse(width / 2, height * 0.6, width * 0.15, height * 0.05, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Teeth
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(width * 0.4, height * 0.58, width * 0.2, height * 0.04);
    ctx.strokeRect(width * 0.4, height * 0.58, width * 0.2, height * 0.04);

    // Tongue
    ctx.fillStyle = "#f87171";
    ctx.beginPath();
    ctx.ellipse(width / 2, height * 0.68, width * 0.08, height * 0.06, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Labels
    ctx.fillStyle = "#0f172a";
    ctx.font = "14px sans-serif";
    ctx.fillText("Lips", width * 0.1, height * 0.6);
    ctx.fillText("Teeth", width * 0.42, height * 0.56);
    ctx.fillText("Tongue", width * 0.7, height * 0.7);

    ctx.restore();
  };

  const drawAlphabetTemplate = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.save();
    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 24px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
    const cols = 6;
    const rows = 5;
    const cellWidth = width / cols;
    const cellHeight = height / rows;

    alphabet.forEach((letter, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = col * cellWidth + cellWidth / 2;
      const y = row * cellHeight + cellHeight / 2;

      // Highlight speech sounds
      if (["R", "S", "L", "T"].includes(letter)) {
        ctx.fillStyle = "#fef3c7";
        ctx.fillRect(col * cellWidth + 5, row * cellHeight + 5, cellWidth - 10, cellHeight - 10);
        ctx.fillStyle = "#0f172a";
      }

      ctx.fillText(letter, x, y);
    });

    ctx.restore();
  };

  const drawPacingTemplate = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.save();
    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 32px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const numbers = 10;
    const cellWidth = width / numbers;

    for (let i = 1; i <= numbers; i++) {
      const x = (i - 1) * cellWidth + cellWidth / 2;
      const y = height / 2;

      // Draw circle
      ctx.beginPath();
      ctx.arc(x, y, Math.min(cellWidth, height) * 0.3, 0, Math.PI * 2);
      ctx.fillStyle = "#e0f2fe";
      ctx.fill();
      ctx.strokeStyle = "#0f172a";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw number
      ctx.fillStyle = "#0f172a";
      ctx.fillText(i.toString(), x, y);
    }

    ctx.restore();
  };

  // Initialize canvas with high DPI support
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    ctx.scale(dpr, dpr);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, rect.width, rect.height);

    ctxRef.current = ctx;
  }, []);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas || !ctxRef.current) return;

      const imageData = ctxRef.current.getImageData(0, 0, canvas.width, canvas.height);
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      ctxRef.current.scale(dpr, dpr);
      ctxRef.current.putImageData(imageData, 0, 0);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // WebSocket message handling
  useEffect(() => {
    if (!ws) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const data: WSMessage = JSON.parse(event.data);

        switch (data.type) {
          case "draw_start":
            handleRemoteDrawStart(data.x, data.y, data.color, data.width);
            break;
          case "draw_move":
            handleRemoteDrawMove(data.x, data.y);
            break;
          case "draw_end":
            handleRemoteDrawEnd();
            break;
          case "clear_canvas":
            clearCanvas();
            break;
          case "add_text":
            handleRemoteAddText(data.x, data.y, data.text, data.color);
            break;
          case "cursor_move":
            handleRemoteCursorMove(data.x, data.y, data.sender);
            break;
          case "turn_change":
            setActiveDrawerId(data.activeDrawerId);
            setIsMyTurn(data.activeDrawerId === clientId);
            break;
          case "template_change":
            setTemplate(data.templateId);
            break;
          case "tile_move":
            handleRemoteTileMove(data.tileId, data.x, data.y, data.letter);
            break;
          case "add_sticker":
            handleRemoteAddSticker(data.sticker, data.x, data.y);
            break;
          case "flashcard_change":
            setCurrentFlashcard(data.index);
            break;
          case "match_success":
            handleRemoteMatchSuccess(data.matchId);
            break;
          case "reaction":
            handleRemoteReaction(data.emoji);
            break;
          case "anatomy_cue_change":
            setActivePhoneme(data.phoneme);
            setActiveAnatomyAssets(data.activeAssets);
            setShowPhonemeVisualizer(true);
            break;
        }
      } catch (e) {
        console.error("Failed to parse WebSocket message:", e);
      }
    };

    ws.addEventListener("message", handleMessage);
    return () => ws.removeEventListener("message", handleMessage);
  }, [ws, clientId]);

  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ("touches" in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const getNormalizedCoordinates = (x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { normX: 0, normY: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      normX: x / rect.width,
      normY: y / rect.height,
    };
  };

  const getCanvasCoordinatesFromNormalized = (normX: number, normY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: normX * rect.width,
      y: normY * rect.height,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isMyTurn) return;
    
    if (tool === "sticker" && selectedSticker) {
      const coords = getCanvasCoordinates(e);
      const { normX, normY } = getNormalizedCoordinates(coords.x, coords.y);
      handleStickerStamp(normX, normY);
      return;
    }
    
    if (tool === "text") {
      const coords = getCanvasCoordinates(e);
      setTextPosition(coords);
      return;
    }

    setIsDrawing(true);
    const { x, y } = getCanvasCoordinates(e);
    const { normX, normY } = getNormalizedCoordinates(x, y);

    if (ctxRef.current) {
      ctxRef.current.beginPath();
      ctxRef.current.moveTo(x, y);
    }

    sendWebSocketMessage({
      type: "draw_start",
      x: normX,
      y: normY,
      color: tool === "eraser" ? "#ffffff" : color,
      width: strokeWidth,
    });
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !isMyTurn) return;

    const { x, y } = getCanvasCoordinates(e);
    const { normX, normY } = getNormalizedCoordinates(x, y);

    if (ctxRef.current) {
      ctxRef.current.strokeStyle = tool === "eraser" ? "#ffffff" : color;
      ctxRef.current.lineWidth = strokeWidth;
      ctxRef.current.lineTo(x, y);
      ctxRef.current.stroke();
    }

    sendWebSocketMessage({
      type: "draw_move",
      x: normX,
      y: normY,
    });
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    if (ctxRef.current) {
      ctxRef.current.closePath();
    }

    sendWebSocketMessage({ type: "draw_end" });
  };

  const handleRemoteDrawStart = (normX: number, normY: number, remoteColor: string, remoteWidth: number) => {
    const { x, y } = getCanvasCoordinatesFromNormalized(normX, normY);

    if (ctxRef.current) {
      ctxRef.current.beginPath();
      ctxRef.current.moveTo(x, y);
      ctxRef.current.strokeStyle = remoteColor;
      ctxRef.current.lineWidth = remoteWidth;
    }
  };

  const handleRemoteDrawMove = (normX: number, normY: number) => {
    const { x, y } = getCanvasCoordinatesFromNormalized(normX, normY);

    if (ctxRef.current) {
      ctxRef.current.lineTo(x, y);
      ctxRef.current.stroke();
    }
  };

  const handleRemoteDrawEnd = () => {
    if (ctxRef.current) {
      ctxRef.current.closePath();
    }
  };

  const handleRemoteAddText = (normX: number, normY: number, text: string, remoteColor: string) => {
    const { x, y } = getCanvasCoordinatesFromNormalized(normX, normY);

    if (ctxRef.current) {
      ctxRef.current.font = "16px sans-serif";
      ctxRef.current.fillStyle = remoteColor;
      ctxRef.current.fillText(text, x, y);
    }
  };

  const handleRemoteCursorMove = (normX: number, normY: number, sender: string) => {
    if (sender === clientId) return;

    setRemoteCursors((prev) => ({
      ...prev,
      [sender]: { x: normX, y: normY, sender },
    }));

    // Remove cursor after delay
    setTimeout(() => {
      setRemoteCursors((prev) => {
        const newCursors = { ...prev };
        delete newCursors[sender];
        return newCursors;
      });
    }, 2000);
  };

  const handleRemoteTileMove = (tileId: string, normX: number, normY: number, letter: string) => {
    setLetterTiles((prev) =>
      prev.map((tile) =>
        tile.id === tileId ? { ...tile, x: normX, y: normY, inTray: false } : tile
      )
    );
  };

  const handleRemoteAddSticker = (stickerType: "star" | "check" | "thumbs", normX: number, normY: number) => {
    const newSticker: Sticker = {
      id: `sticker-${Date.now()}`,
      type: stickerType,
      x: normX,
      y: normY,
    };
    setStickers((prev) => [...prev, newSticker]);
  };

  const handleRemoteMatchSuccess = (matchId: string) => {
    setMatchItems((prev) => prev.map((item) => (item.id === matchId ? { ...item, matched: true } : item)));
  };

  const handleRemoteReaction = (emoji: string) => {
    const newReactions = Array.from({ length: 6 }, (_, i) => ({
      emoji,
      id: Date.now() + i,
      progress: 0,
    }));
    setReactions((prev) => [...prev, ...newReactions]);

    // Animate reactions
    newReactions.forEach((reaction) => {
      let progress = 0;
      const animate = () => {
        progress += 0.02;
        setReactions((prev) =>
          prev.map((r) =>
            r.id === reaction.id ? { ...r, progress } : r
          )
        );
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setReactions((prev) => prev.filter((r) => r.id !== reaction.id));
        }
      };
      requestAnimationFrame(animate);
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoordinates(e);
    const { normX, normY } = getNormalizedCoordinates(x, y);

    // Throttle cursor updates
    if (ws && ws.readyState === WebSocket.OPEN) {
      sendWebSocketMessage({
        type: "cursor_move",
        x: normX,
        y: normY,
        sender: clientId,
      });
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !ctxRef.current) return;

    const rect = canvas.getBoundingClientRect();
    ctxRef.current.fillStyle = "#ffffff";
    ctxRef.current.fillRect(0, 0, rect.width, rect.height);
    
    // Redraw template
    drawTemplate(template, rect.width, rect.height);

    sendWebSocketMessage({ type: "clear_canvas" });
  };

  const changeTemplate = (templateId: Template) => {
    setTemplate(templateId);
    sendWebSocketMessage({ type: "template_change", templateId });
  };

  const handleTileDrag = (tileId: string, normX: number, normY: number) => {
    setLetterTiles((prev) =>
      prev.map((tile) =>
        tile.id === tileId ? { ...tile, x: normX, y: normY, inTray: false } : tile
      )
    );
    sendWebSocketMessage({
      type: "tile_move",
      tileId,
      x: normX,
      y: normY,
      letter: letterTiles.find((t) => t.id === tileId)?.letter || "",
    });
  };

  const resetTiles = () => {
    const resetTiles: LetterTile[] = LETTERS.map((letter, index) => ({
      id: `tile-${index}`,
      letter,
      x: 0.05 + (index % 7) * 0.13,
      y: 0.85 + Math.floor(index / 7) * 0.12,
      inTray: true,
    }));
    setLetterTiles(resetTiles);
    sendWebSocketMessage({ type: "tile_reset" });
  };

  const handleStickerStamp = (normX: number, normY: number) => {
    if (!selectedSticker) return;

    const newSticker: Sticker = {
      id: `sticker-${Date.now()}`,
      type: selectedSticker,
      x: normX,
      y: normY,
    };
    setStickers((prev) => [...prev, newSticker]);
    sendWebSocketMessage({
      type: "add_sticker",
      sticker: selectedSticker,
      x: normX,
      y: normY,
    });
    setSelectedSticker(null);
  };

  const handleFlashcardChange = (direction: "next" | "prev") => {
    const newIndex = direction === "next" 
      ? (currentFlashcard + 1) % FLASHCARDS.length
      : (currentFlashcard - 1 + FLASHCARDS.length) % FLASHCARDS.length;
    setCurrentFlashcard(newIndex);
    sendWebSocketMessage({ type: "flashcard_change", index: newIndex });
  };

  const handleMatchItemClick = (itemId: string) => {
    if (selectedMatchItem === null) {
      setSelectedMatchItem(itemId);
    } else if (selectedMatchItem !== itemId) {
      // Check if it's a match
      const selectedItem = matchItems.find((item) => item.id === selectedMatchItem);
      const clickedItem = matchItems.find((item) => item.id === itemId);

      if (selectedItem && clickedItem && !selectedItem.matched && !clickedItem.matched) {
        // Simple matching logic - you can enhance this
        const isMatch = selectedItem.word === clickedItem.word || 
                       (selectedItem.emoji === clickedItem.emoji && selectedItem.word !== clickedItem.word);
        
        if (isMatch) {
          setMatchItems((prev) =>
            prev.map((item) =>
              item.id === selectedMatchItem || item.id === itemId
                ? { ...item, matched: true }
                : item
            )
          );
          sendWebSocketMessage({ type: "match_success", matchId: selectedMatchItem });
          sendWebSocketMessage({ type: "match_success", matchId: itemId });
        }
      }
      setSelectedMatchItem(null);
    }
  };

  const triggerReaction = (emoji: string) => {
    const newReactions = Array.from({ length: 6 }, (_, i) => ({
      emoji,
      id: Date.now() + i,
      progress: 0,
    }));
    setReactions((prev) => [...prev, ...newReactions]);
    sendWebSocketMessage({ type: "reaction", emoji });

    // Animate reactions
    newReactions.forEach((reaction) => {
      let progress = 0;
      const animate = () => {
        progress += 0.02;
        setReactions((prev) =>
          prev.map((r) =>
            r.id === reaction.id ? { ...r, progress } : r
          )
        );
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setReactions((prev) => prev.filter((r) => r.id !== reaction.id));
        }
      };
      requestAnimationFrame(animate);
    });
  };

  const handleAddText = () => {
    if (!textPosition || !textInput.trim() || !ctxRef.current) return;

    const { x, y } = textPosition;
    const { normX, normY } = getNormalizedCoordinates(x, y);

    ctxRef.current.font = "16px sans-serif";
    ctxRef.current.fillStyle = color;
    ctxRef.current.fillText(textInput, x, y);

    sendWebSocketMessage({
      type: "add_text",
      x: normX,
      y: normY,
      text: textInput,
      color: color,
    });

    setTextInput("");
    setTextPosition(null);
  };

  const saveSnapshot = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL("image/png");
    
    // Call the parent callback to track the snapshot
    if (onSnapshotCapture) {
      onSnapshotCapture(dataUrl);
    }
    
    // Also trigger download for immediate feedback
    const link = document.createElement("a");
    link.download = `smartboard-snapshot-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  };

  const passTurn = () => {
    const newDrawerId = activeDrawerId === clientId ? "peer" : clientId;
    setActiveDrawerId(newDrawerId);
    setIsMyTurn(newDrawerId === clientId);

    sendWebSocketMessage({
      type: "turn_change",
      activeDrawerId: newDrawerId,
    });
  };

  const sendWebSocketMessage = (data: any) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-800 rounded-lg border border-slate-700">
      {/* Turn Indicator */}
      <div className="bg-slate-700 border-b border-slate-600 p-3">
        <div className="flex items-center justify-between">
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${isMyTurn ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"}`}>
            {isMyTurn ? "✏️ Your Turn to Draw" : "👀 Observing (Peer's Turn)"}
          </div>
          <button
            onClick={passTurn}
            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 rounded text-sm font-medium transition-colors"
          >
            {isMyTurn ? "Pass Turn" : "Take Turn"}
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-slate-700 border-b border-slate-600 p-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Template Selector */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400">Template:</label>
            <select
              value={template}
              onChange={(e) => changeTemplate(e.target.value as Template)}
              className="bg-slate-600 border border-slate-500 rounded px-2 py-1 text-sm text-white"
            >
              <option value="blank">Blank</option>
              <option value="mouth">Mouth Anatomy</option>
              <option value="alphabet">Alphabet Grid</option>
              <option value="pacing">Pacing Board</option>
            </select>
          </div>

          {/* Tools */}
          <div className="flex gap-2">
            <button
              onClick={() => setTool("pen")}
              className={`px-3 py-1 rounded text-sm ${tool === "pen" ? "bg-indigo-600" : "bg-slate-600 hover:bg-slate-500"}`}
            >
              Pen
            </button>
            <button
              onClick={() => setTool("eraser")}
              className={`px-3 py-1 rounded text-sm ${tool === "eraser" ? "bg-indigo-600" : "bg-slate-600 hover:bg-slate-500"}`}
            >
              Eraser
            </button>
            <button
              onClick={() => setTool("text")}
              className={`px-3 py-1 rounded text-sm ${tool === "text" ? "bg-indigo-600" : "bg-slate-600 hover:bg-slate-500"}`}
            >
              Text
            </button>
            <button
              onClick={() => setTool("sticker")}
              className={`px-3 py-1 rounded text-sm ${tool === "sticker" ? "bg-indigo-600" : "bg-slate-600 hover:bg-slate-500"}`}
            >
              Sticker
            </button>
          </div>

          {/* Colors */}
          <div className="flex gap-1">
            {Object.entries(COLORS).map(([name, value]) => (
              <button
                key={name}
                onClick={() => setColor(value)}
                className={`w-6 h-6 rounded border-2 ${color === value ? "border-white" : "border-transparent"}`}
                style={{ backgroundColor: value }}
                title={name}
              />
            ))}
          </div>

          {/* Stroke Widths */}
          <div className="flex gap-2">
            <button
              onClick={() => setStrokeWidth(STROKE_WIDTHS.fine)}
              className={`px-2 py-1 rounded text-xs ${strokeWidth === STROKE_WIDTHS.fine ? "bg-indigo-600" : "bg-slate-600 hover:bg-slate-500"}`}
            >
              Fine
            </button>
            <button
              onClick={() => setStrokeWidth(STROKE_WIDTHS.medium)}
              className={`px-2 py-1 rounded text-xs ${strokeWidth === STROKE_WIDTHS.medium ? "bg-indigo-600" : "bg-slate-600 hover:bg-slate-500"}`}
            >
              Medium
            </button>
            <button
              onClick={() => setStrokeWidth(STROKE_WIDTHS.thick)}
              className={`px-2 py-1 rounded text-xs ${strokeWidth === STROKE_WIDTHS.thick ? "bg-indigo-600" : "bg-slate-600 hover:bg-slate-500"}`}
            >
              Thick
            </button>
          </div>

          {/* Sticker Selection */}
          {tool === "sticker" && (
            <div className="flex gap-1">
              <button
                onClick={() => setSelectedSticker("star")}
                className={`w-8 h-8 rounded ${selectedSticker === "star" ? "bg-amber-500" : "bg-slate-600 hover:bg-slate-500"}`}
              >
                ⭐
              </button>
              <button
                onClick={() => setSelectedSticker("check")}
                className={`w-8 h-8 rounded ${selectedSticker === "check" ? "bg-emerald-500" : "bg-slate-600 hover:bg-slate-500"}`}
              >
                ✅
              </button>
              <button
                onClick={() => setSelectedSticker("thumbs")}
                className={`w-8 h-8 rounded ${selectedSticker === "thumbs" ? "bg-blue-500" : "bg-slate-600 hover:bg-slate-500"}`}
              >
                👍
              </button>
            </div>
          )}

          {/* Therapy Tools */}
          <div className="flex gap-2">
            <button
              onClick={() => setShowFlashcards(!showFlashcards)}
              className={`px-3 py-1 rounded text-sm ${showFlashcards ? "bg-purple-600" : "bg-slate-600 hover:bg-slate-500"}`}
            >
              📚 Flashcards
            </button>
            <button
              onClick={() => setShowMatching(!showMatching)}
              className={`px-3 py-1 rounded text-sm ${showMatching ? "bg-pink-600" : "bg-slate-600 hover:bg-slate-500"}`}
            >
              🎯 Matching
            </button>
            <button
              onClick={() => setShowPhonemeVisualizer(!showPhonemeVisualizer)}
              className={`px-3 py-1 rounded text-sm ${showPhonemeVisualizer ? "bg-cyan-600" : "bg-slate-600 hover:bg-slate-500"}`}
            >
              🗣️ Anatomy
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-2 ml-auto">
            <button
              onClick={resetTiles}
              className="px-3 py-1 bg-orange-600 hover:bg-orange-700 rounded text-sm font-medium transition-colors"
            >
              Reset Tiles
            </button>
            <button
              onClick={clearCanvas}
              className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm font-medium transition-colors"
            >
              Clear Board
            </button>
            <button
              onClick={saveSnapshot}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 rounded text-sm font-medium transition-colors"
            >
              Save Snapshot
            </button>
          </div>
        </div>
      </div>

      {/* Canvas Container */}
      <div className="flex-1 relative bg-white">
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-crosshair"
          onMouseDown={startDrawing}
          onMouseMove={(e) => {
            handleMouseMove(e);
            draw(e);
          }}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          style={{ pointerEvents: isMyTurn ? "auto" : "none" }}
        />

        {/* Remote Cursors */}
        {Object.entries(remoteCursors).map(([sender, cursor]) => {
          const { x, y } = getCanvasCoordinatesFromNormalized(cursor.x, cursor.y);
          return (
            <div
              key={sender}
              className="absolute pointer-events-none z-10"
              style={{
                left: `${x}px`,
                top: `${y}px`,
                transform: "translate(-50%, -50%)",
              }}
            >
              <div className="w-4 h-4 bg-indigo-500 rounded-full shadow-lg" />
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                {sender}
              </div>
            </div>
          );
        })}

        {/* Text Input Modal */}
        {textPosition && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
            <div className="bg-slate-800 p-4 rounded-lg border border-slate-600">
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddText()}
                placeholder="Enter text..."
                className="bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                autoFocus
              />
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleAddText}
                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 rounded text-sm font-medium"
                >
                  Add
                </button>
                <button
                  onClick={() => {
                    setTextPosition(null);
                    setTextInput("");
                  }}
                  className="px-3 py-1 bg-slate-600 hover:bg-slate-500 rounded text-sm font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Letter Tiles */}
        {letterTiles.map((tile) => (
          <div
            key={tile.id}
            className="absolute cursor-move z-10"
            style={{
              left: `${tile.x * 100}%`,
              top: `${tile.y * 100}%`,
              transform: "translate(-50%, -50%)",
            }}
            draggable
            onDragEnd={(e) => {
              const canvas = canvasRef.current;
              if (!canvas) return;
              const rect = canvas.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const y = e.clientY - rect.top;
              const { normX, normY } = getNormalizedCoordinates(x, y);
              handleTileDrag(tile.id, normX, normY);
            }}
          >
            <div className="w-10 h-10 bg-indigo-100 border-2 border-indigo-500 rounded-lg flex items-center justify-center text-indigo-900 font-bold text-lg shadow-lg">
              {tile.letter}
            </div>
          </div>
        ))}

        {/* Stickers */}
        {stickers.map((sticker) => {
          const emoji = sticker.type === "star" ? "⭐" : sticker.type === "check" ? "✅" : "👍";
          return (
            <div
              key={sticker.id}
              className="absolute z-10 text-4xl animate-bounce"
              style={{
                left: `${sticker.x * 100}%`,
                top: `${sticker.y * 100}%`,
                transform: "translate(-50%, -50%)",
              }}
            >
              {emoji}
            </div>
          );
        })}

        {/* Flashcards Modal */}
        {showFlashcards && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-30">
            <div className="bg-slate-800 p-6 rounded-lg border border-slate-600 max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-indigo-400">Articulation Flashcards</h3>
                <button
                  onClick={() => setShowFlashcards(false)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              
              <div className="bg-slate-700 rounded-lg p-6 text-center mb-4">
                <div className="text-6xl mb-4">{FLASHCARDS[currentFlashcard].emoji}</div>
                <div className="text-2xl font-bold text-white mb-2">{FLASHCARDS[currentFlashcard].word}</div>
                <div className="text-emerald-400 font-mono text-lg mb-1">{FLASHCARDS[currentFlashcard].phonetic}</div>
                <div className="text-slate-400 text-sm">{FLASHCARDS[currentFlashcard].cue}</div>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => handleFlashcardChange("prev")}
                  className="px-4 py-2 bg-slate-600 hover:bg-slate-500 rounded text-sm font-medium"
                >
                  ← Previous
                </button>
                <div className="text-slate-400 text-sm self-center">
                  {currentFlashcard + 1} / {FLASHCARDS.length}
                </div>
                <button
                  onClick={() => handleFlashcardChange("next")}
                  className="px-4 py-2 bg-slate-600 hover:bg-slate-500 rounded text-sm font-medium"
                >
                  Next →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Matching Game Modal */}
        {showMatching && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-30">
            <div className="bg-slate-800 p-6 rounded-lg border border-slate-600 max-w-lg w-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-pink-400">Picture-Word Matching</h3>
                <button
                  onClick={() => setShowMatching(false)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Pictures */}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-slate-400 mb-2">Pictures</h4>
                  {matchItems.map((item) => (
                    <button
                      key={`pic-${item.id}`}
                      onClick={() => handleMatchItemClick(item.id)}
                      disabled={item.matched}
                      className={`w-full p-4 rounded-lg text-3xl transition-all ${
                        item.matched
                          ? "bg-emerald-600/20 border-emerald-500 opacity-50"
                          : selectedMatchItem === item.id
                          ? "bg-indigo-600 border-indigo-400"
                          : "bg-slate-700 border-slate-600 hover:bg-slate-600"
                      } border-2`}
                    >
                      {item.emoji}
                    </button>
                  ))}
                </div>

                {/* Words */}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-slate-400 mb-2">Words</h4>
                  {matchItems.map((item) => (
                    <button
                      key={`word-${item.id}`}
                      onClick={() => handleMatchItemClick(item.id)}
                      disabled={item.matched}
                      className={`w-full p-4 rounded-lg text-lg font-semibold transition-all ${
                        item.matched
                          ? "bg-emerald-600/20 border-emerald-500 opacity-50"
                          : selectedMatchItem === item.id
                          ? "bg-indigo-600 border-indigo-400"
                          : "bg-slate-700 border-slate-600 hover:bg-slate-600"
                      } border-2`}
                    >
                      {item.word}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Phoneme Visualizer Modal */}
        {showPhonemeVisualizer && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-40">
            <div className="bg-slate-800 rounded-lg border border-slate-600 w-full max-w-4xl h-3/4 flex flex-col">
              <div className="flex justify-between items-center p-4 border-b border-slate-600">
                <h3 className="text-lg font-bold text-cyan-400">Speech Articulation Visualizer</h3>
                <button
                  onClick={() => setShowPhonemeVisualizer(false)}
                  className="text-slate-400 hover:text-white text-2xl"
                >
                  ✕
                </button>
              </div>
              <div className="flex-1 p-4">
                <PhonemeVisualizer 
                  ws={ws} 
                  clientId={clientId} 
                  initialPhoneme={activePhoneme}
                  initialAssets={activeAnatomyAssets.length > 0 ? activeAnatomyAssets : undefined}
                />
              </div>
            </div>
          </div>
        )}

        {/* Floating Reactions */}
        {reactions.map((reaction) => (
          <div
            key={reaction.id}
            className="absolute text-3xl pointer-events-none"
            style={{
              left: `${Math.random() * 80 + 10}%`,
              bottom: `${reaction.progress * 200}px`,
              transform: `scale(${1 + reaction.progress * 0.5})`,
              opacity: 1 - reaction.progress,
            }}
          >
            {reaction.emoji}
          </div>
        ))}

        {/* Emoji Reactions Bar */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-800/90 rounded-full px-4 py-2 flex gap-2 border border-slate-600 z-20">
          {["🎉", "💖", "👏", "✨", "🔥"].map((emoji) => (
            <button
              key={emoji}
              onClick={() => triggerReaction(emoji)}
              className="text-2xl hover:scale-125 transition-transform"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}