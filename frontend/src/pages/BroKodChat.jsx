import React, { useState, useEffect, useRef } from 'react';
import {
    Bot,
    PanelLeftClose,
    PanelLeftOpen,
    Plus,
    Search,
    Image as ImageIcon,
    Grid,
    Code,
    FolderGit2,
    ChevronDown,
    Sparkles,
    User,
    RefreshCw,
    Mic,
    Headphones,
    ArrowUp,
    Settings,
    MoreHorizontal,
    Lightbulb,
    GraduationCap,
    PenTool,
    Compass,
    Globe,
    LogOut,
    MessageSquare,
    Zap,
    HelpCircle,
    FileText,
    Home,
    Volume2,
    VolumeX
} from 'lucide-react';
import { HfInference } from "@huggingface/inference";
import { useNavigate } from 'react-router-dom';
import './BroKodChat.css';

export default function BroKodChat() {
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [chatInput, setChatInput] = useState("");
    const [messages, setMessages] = useState([]);
    const [isTyping, setIsTyping] = useState(false);
    const [soundEnabled, setSoundEnabled] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const hf = new HfInference(import.meta.env.VITE_HF_TOKEN);

    const handleSendMessage = async (text = chatInput) => {
        // If called from an event where text is an object, fallback to chatInput
        const actualText = typeof text === 'string' ? text : chatInput;
        if (!actualText.trim()) return;

        // Add user message
        const newMessages = [...messages, { role: 'user', content: actualText }];
        setMessages(newMessages);
        setChatInput("");
        setIsTyping(true);

        const lowerText = actualText.toLowerCase();

        // Check for image generation
        if (lowerText.includes('image') || lowerText.includes('draw') || lowerText.includes('generate')) {
            const responseText = "Here is the image you requested. Let me know if you want another one!";
            const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(actualText)}?width=1024&height=1024&nologo=true`;

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: responseText,
                image: imageUrl
            }]);

            if (soundEnabled && window.speechSynthesis) {
                window.speechSynthesis.cancel();
                const utterance = new SpeechSynthesisUtterance(responseText);
                window.speechSynthesis.speak(utterance);
            }

            setIsTyping(false);
            return;
        }

        try {
            const chatHistory = newMessages.map(msg => ({
                role: msg.role === 'assistant' ? 'assistant' : 'user',
                content: msg.content
            }));

            // Provide a system instruction to formulate detailed and direct answers
            const messagesWithSystem = [
                {
                    role: "system",
                    content: "You are a helpful, intelligent, and highly knowledgeable AI assistant. Always provide a clear, comprehensive, and detailed answer directly. Give as much relevant information as possible, and do not ask for clarification unless completely necessary; instead, provide the best possible and most detailed answer based on the most likely intent of the user."
                },
                ...chatHistory
            ];

            const out = await hf.chatCompletion({
                model: "Qwen/Qwen2.5-7B-Instruct",
                messages: messagesWithSystem,
                max_tokens: 1024,
                temperature: 0.7,
            });

            const responseText = out.choices[0].message.content;

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: responseText,
                image: null
            }]);

            if (soundEnabled && window.speechSynthesis) {
                window.speechSynthesis.cancel();
                const utterance = new SpeechSynthesisUtterance(responseText);
                window.speechSynthesis.speak(utterance);
            }
        } catch (error) {
            console.error("AI Generation Error: ", error);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `Sorry, there was an error generating a response: ${error.message || "Please try again later"}`,
                image: null
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleVoiceInput = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Your browser does not support Speech Recognition.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        setIsListening(true);

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            setChatInput(prev => prev ? prev + ' ' + transcript : transcript);
            setIsListening(false);
        };

        recognition.onerror = (event) => {
            console.error("Speech recognition error", event.error);
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognition.start();
    };

    const navItems = [
        { icon: <Plus size={18} />, label: "New chat", action: () => { setMessages([]); setChatInput(""); } },
        { icon: <MessageSquare size={18} />, label: "AI Assistant App", action: () => alert("Switching to standard AI Assistant App model") },
        { icon: <Compass size={18} />, label: "Explore GPTs", action: () => handleSendMessage("Show me some interesting GPTs to explore") },
    ];

    const toolsItems = [
        { icon: <ImageIcon size={18} />, label: "Image Generation", action: () => handleSendMessage("Generate an image of a beautiful futuristic city") },
        { icon: <Code size={18} />, label: "Code Interpreter", action: () => handleSendMessage("Write a React code snippet for a counter") },
        { icon: <Globe size={18} />, label: "Web Browsing", action: () => handleSendMessage("Search the latest tech news") },
        { icon: <FileText size={18} />, label: "Data Analysis", action: () => handleSendMessage("Analyze my sales data") },
    ];

    return (
        <div className="chat-app-wrapper">
            <div className={`app-container ${!sidebarOpen ? 'sidebar-closed' : ''}`}>
                {/* Sidebar */}
                <div className={`sidebar ${!sidebarOpen ? 'hidden' : ''}`} style={!sidebarOpen ? { display: 'none' } : {}}>
                    <div className="sidebar-header">
                        <div className="logo-wrapper" onClick={() => setMessages([])} style={{ cursor: 'pointer' }}>
                            <Bot size={24} />
                            <span style={{ fontWeight: 600, fontSize: '15px' }}>AI Assistant App</span>
                        </div>
                        <button className="sidebar-toggle" onClick={() => setSidebarOpen(false)}>
                            <PanelLeftClose size={20} />
                        </button>
                    </div>

                    <div className="nav-list" style={{ marginBottom: 16 }}>
                        {navItems.map((item, idx) => (
                            <div key={`nav-${idx}`} className="nav-item" onClick={item.action}>
                                <span className="icon">{item.icon}</span>
                                <span>{item.label}</span>
                            </div>
                        ))}
                    </div>

                    <div className="chats-header" style={{ fontSize: '11px', textTransform: 'uppercase', marginBottom: '8px', color: '#888', paddingLeft: '12px' }}>
                        Tools & Features
                    </div>
                    <div className="nav-list" style={{ marginBottom: 16 }}>
                        {toolsItems.map((item, idx) => (
                            <div key={`tools-${idx}`} className="nav-item" onClick={item.action}>
                                <span className="icon">{item.icon}</span>
                                <span>{item.label}</span>
                            </div>
                        ))}
                    </div>

                    <div className="chats-wrapper">
                        <div className="chats-header">
                            Your chats <span onClick={() => setMessages([])} style={{ fontSize: 10, fontWeight: 'normal', float: 'right', marginTop: 2, cursor: 'pointer', color: '#999' }}>Clear</span>
                        </div>
                        {/* Mock previous chats */}
                        <div className="nav-item" onClick={() => handleSendMessage("Tell me about React UI Development")}><span style={{ width: 18, marginRight: 12 }}></span>React UI Development</div>
                        <div className="nav-item" onClick={() => handleSendMessage("How to build an AI Assistant App Clone")}><span style={{ width: 18, marginRight: 12 }}></span>AI Assistant App Clone</div>
                    </div>

                    <div className="profile-section">
                        <div className="nav-item" onClick={() => navigate('/dashboard')} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a' }}>
                            <span className="icon"><Home size={18} /></span>
                            <span style={{ fontWeight: 'bold' }}>Back to Dashboard</span>
                        </div>
                        <div style={{ height: '1px', background: '#e5e5e5', margin: '8px 0' }}></div>
                        <div className="profile-item" onClick={() => navigate('/dashboard')}>
                            <div className="profile-left">
                                <div className="avatar">K</div>
                                <div>
                                    <div className="profile-name">KodBank User</div>
                                    <div className="profile-plan">Premium Member</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="main-content">
                    <div className="top-bar">
                        <div className="top-bar-left">
                            {!sidebarOpen && (
                                <button className="sidebar-toggle" style={{ marginRight: '12px' }} onClick={() => setSidebarOpen(true)}>
                                    <PanelLeftOpen size={20} />
                                </button>
                            )}
                            <div className="model-selector">
                                AI Assistant <span style={{ fontSize: '13px', color: '#888', marginLeft: '6px', marginTop: '2px', fontWeight: 'bold' }}>App</span>
                            </div>
                        </div>

                        <div className="top-bar-right">
                            <button className="get-plus-btn" onClick={() => navigate('/dashboard')}>
                                <Home size={16} />
                                Dashboard
                            </button>
                        </div>
                    </div>

                    <div className="chat-area">
                        {messages.length === 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, paddingBottom: '100px' }}>
                                <div style={{ background: '#fff', border: '1px solid #eaeaea', borderRadius: '50%', padding: '12px', marginBottom: '24px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                                    <img src="https://cdn-icons-png.flaticon.com/512/2040/2040946.png" width={40} height={40} alt="ChatGPT Logo" />
                                </div>
                                <h1 className="hero-title" style={{ textAlign: 'center' }}>How can AI Assistant App help you?</h1>

                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center', maxWidth: '750px', marginTop: '10px' }}>
                                    {[
                                        { icon: <ImageIcon size={18} color="#eab308" />, text: "Create an image", prompt: "Create a beautiful image of a futuristic city" },
                                        { icon: <Code size={18} color="#3b82f6" />, text: "Code a snake game", prompt: "Write code for a snake game in React" },
                                        { icon: <Lightbulb size={18} color="#22c55e" />, text: "Give me ideas", prompt: "Give me ideas for a 10th birthday party" },
                                        { icon: <GraduationCap size={18} color="#ef4444" />, text: "Help me study", prompt: "Help me study for my biology exam" },
                                    ].map((item, idx) => (
                                        <div
                                            key={idx}
                                            onClick={() => handleSendMessage(item.prompt)}
                                            style={{
                                                padding: '12px 18px', border: '1px solid #e5e5e5', borderRadius: '24px',
                                                display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
                                                fontSize: '14px', fontWeight: 500, color: '#444', background: '#fff'
                                            }}
                                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f4f4f4'}
                                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#fff'}
                                        >
                                            {item.icon}
                                            <span>{item.text}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="messages">
                                {messages.map((msg, idx) => (
                                    <div key={idx} className={`message ${msg.role}`}>
                                        {msg.role === 'assistant' && (
                                            <div className="message-avatar" style={{ background: '#fff', border: '1px solid #ddd', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <img src="https://cdn-icons-png.flaticon.com/512/2040/2040946.png" width={20} alt="Avatar" />
                                            </div>
                                        )}
                                        <div className={msg.role === 'user' ? 'user-bubble' : 'message-content'}>
                                            {msg.content}
                                            {msg.image && (
                                                <div style={{ marginTop: '12px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e5e5e5' }}>
                                                    <img src={msg.image} alt="Generated" style={{ width: '100%', maxWidth: '512px', borderRadius: '12px', display: 'block' }} loading="lazy" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {isTyping && (
                                    <div className="message assistant">
                                        <div className="message-avatar" style={{ background: '#fff', border: '1px solid #ddd', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <img src="https://cdn-icons-png.flaticon.com/512/2040/2040946.png" width={20} alt="Avatar" />
                                        </div>
                                        <div className="message-content">
                                            <div className="typing-indicator">
                                                <span>_</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} style={{ height: 1 }} />
                            </div>
                        )}

                        <div style={{ width: '100%', maxWidth: '768px', margin: '0 auto', marginTop: 'auto' }}>
                            <div className="input-container">
                                <button className="action-btn" title="Add attachment" onClick={() => alert("Attach file feature")}>
                                    <Plus size={20} />
                                </button>
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="Ask anything"
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleSendMessage();
                                    }}
                                />
                                <div className="input-actions">
                                    <button className="action-btn" onClick={() => {
                                        setSoundEnabled(!soundEnabled);
                                        if (soundEnabled && window.speechSynthesis) window.speechSynthesis.cancel();
                                    }} title={soundEnabled ? "Mute responses" : "Read responses aloud"}>
                                        {soundEnabled ? <Volume2 size={20} color="#22c55e" /> : <VolumeX size={20} />}
                                    </button>
                                    <button className="action-btn" title="Voice input" onClick={handleVoiceInput} style={{ color: isListening ? '#ef4444' : 'inherit' }}>
                                        <Mic size={20} />
                                    </button>
                                    {chatInput.trim() ? (
                                        <button className="submit-btn" onClick={() => handleSendMessage()} style={{ background: '#fcd34d', color: '#1e293b' }}>
                                            <ArrowUp size={16} />
                                        </button>
                                    ) : (
                                        <button className="submit-btn" style={{ background: '#fcd34d', color: '#1e293b' }} title="Headphones mode" onClick={() => alert("Headphones mode feature")}>
                                            <Headphones size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div style={{ textAlign: 'center', fontSize: '12px', color: '#999', marginTop: '12px', marginBottom: '8px' }}>
                                AI Assistant App can make mistakes. Consider verifying important information.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
