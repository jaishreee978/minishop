import { useState, useEffect, useMemo, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBag, 
  Home, 
  Package, 
  Tag, 
  Plus, 
  X, 
  ShoppingCart, 
  Search,
  ChevronRight,
  Trash2,
  PlusCircle,
  MinusCircle,
  AlertTriangle,
  Percent,
  Gift,
  Zap,
  Clock,
  LogOut,
  User as UserIcon,
  LogIn,
  Heart,
  MessageSquare,
  Camera,
  Mic,
  MicOff,
  LayoutDashboard,
  Send,
  Sparkles,
  Eye,
  TrendingUp,
  DollarSign,
  BarChart3
} from 'lucide-react';
import { auth, googleProvider } from './firebase';
import { signInWithPopup, signOut } from 'firebase/auth';
import { useAuthState } from 'react-firebase-hooks/auth';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import Markdown from 'react-markdown';
import { getShoppingAssistantResponse, identifyProductFromImage } from './services/geminiService';

interface Offer {
  id: number;
  title: string;
  description: string;
  code: string;
  discount: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  icon: any;
  color: string;
}

interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  image: string;
}

interface CartItem extends Product {
  quantity: number;
}

type Tab = 'home' | 'cart' | 'orders' | 'offers' | 'wishlist' | 'dashboard' | 'profile';

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [isClearCartModalOpen, setIsClearCartModalOpen] = useState(false);
  const [user, loading, error] = useAuthState(auth);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Offer | null>(null);
  const [couponError, setCouponError] = useState('');
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [isGuest, setIsGuest] = useState(false);
  const [isOrderSuccessModalOpen, setIsOrderSuccessModalOpen] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profileAddress, setProfileAddress] = useState('');
  const [profileGender, setProfileGender] = useState('Not Specified');

  useEffect(() => {
    if (user) {
      setProfileName(user.displayName || '');
    }
  }, [user]);
  const [shippingDetails, setShippingDetails] = useState({
    name: '',
    email: '',
    address: '',
    city: '',
    zip: ''
  });

  // AI Chat State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'ai', text: string }[]>([
    { role: 'ai', text: "Hi! I'm your MiniShop AI assistant. How can I help you find the perfect product today?" }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Visual Search State
  const [isVisualSearchModalOpen, setIsVisualSearchModalOpen] = useState(false);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [visualSearchResults, setVisualSearchResults] = useState<any>(null);

  // Quick View State
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isQuickViewModalOpen, setIsQuickViewModalOpen] = useState(false);

  // Voice Search State
  const [isListening, setIsListening] = useState(false);

  const mockOffers: Offer[] = [
    {
      id: 1,
      title: "Flash Sale",
      description: "Get 20% off on all electronics items.",
      code: "FLASH20",
      discount: "20% OFF",
      discountType: 'percentage',
      discountValue: 20,
      icon: Zap,
      color: "bg-amber-500"
    },
    {
      id: 2,
      title: "Welcome Gift",
      description: "First time shopping? Enjoy a special discount.",
      code: "WELCOME10",
      discount: "$10 OFF",
      discountType: 'fixed',
      discountValue: 10,
      icon: Gift,
      color: "bg-emerald-500"
    },
    {
      id: 3,
      title: "Weekend Special",
      description: "Extra savings on all accessories this weekend.",
      code: "WEEKEND15",
      discount: "15% OFF",
      discountType: 'percentage',
      discountValue: 15,
      icon: Percent,
      color: "bg-indigo-500"
    },
    {
      id: 4,
      title: "Limited Time",
      description: "Hurry up! Exclusive deals on gaming gear.",
      code: "GAMER50",
      discount: "UP TO 50%",
      discountType: 'percentage',
      discountValue: 50,
      icon: Clock,
      color: "bg-rose-500"
    }
  ];

  // Form state for new product
  const [newProductName, setNewProductName] = useState('');
  const [newProductPrice, setNewProductPrice] = useState('');
  const [newProductImage, setNewProductImage] = useState('');
  const [newProductCategory, setNewProductCategory] = useState('Electronics');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/products');
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddProduct = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProductName,
          price: parseFloat(newProductPrice),
          category: newProductCategory,
          image: newProductImage
        })
      });
      if (response.ok) {
        await fetchProducts();
        setIsAddProductModalOpen(false);
        setNewProductName('');
        setNewProductPrice('');
        setNewProductImage('');
        setNewProductCategory('Electronics');
      }
    } catch (error) {
      console.error('Error adding product:', error);
    }
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const clearCart = () => {
    setCart([]);
    setIsClearCartModalOpen(false);
  };

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cart]);

  const discountAmount = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.discountType === 'percentage') {
      return (cartTotal * appliedCoupon.discountValue) / 100;
    }
    return Math.min(appliedCoupon.discountValue, cartTotal);
  }, [cartTotal, appliedCoupon]);

  const finalTotal = useMemo(() => {
    return Math.max(0, cartTotal - discountAmount);
  }, [cartTotal, discountAmount]);

  const cartCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === 'All' || product.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, activeCategory]);

  const categories = useMemo(() => {
    const cats = ['All', ...new Set(products.map(p => p.category))];
    return cats;
  }, [products]);

  const handleApplyCoupon = () => {
    const coupon = mockOffers.find(o => o.code.toUpperCase() === couponInput.toUpperCase());
    if (coupon) {
      setAppliedCoupon(coupon);
      setCouponError('');
      setCouponInput('');
    } else {
      setCouponError('Invalid coupon code');
      setAppliedCoupon(null);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponError('');
  };

  const startVoiceSearch = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Voice search is not supported in this browser.');
      return;
    }

    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setSearchQuery(transcript);
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const toggleWishlist = (productId: number) => {
    setWishlist(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId) 
        : [...prev, productId]
    );
  };

  const handlePlaceOrder = (e: FormEvent) => {
    e.preventDefault();
    // In a real app, we would send the order to the server here
    setIsOrderSuccessModalOpen(true);
    setCart([]);
    setAppliedCoupon(null);
    setShippingDetails({
      name: '',
      email: '',
      address: '',
      city: '',
      zip: ''
    });
  };

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error("Login failed:", err);
    }
  };

  const handleLogout = async () => {
    try {
      if (user) await signOut(auth);
      setIsGuest(false);
      setCart([]);
      setActiveTab('home');
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  // AI Chat Handlers
  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    
    const userMsg = chatInput;
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsTyping(true);
    
    try {
      const aiResponse = await getShoppingAssistantResponse(userMsg, products);
      setChatMessages(prev => [...prev, { role: 'ai', text: aiResponse || "I'm not sure how to answer that." }]);
    } catch (error) {
      console.error("Chat error:", error);
    } finally {
      setIsTyping(false);
    }
  };

  // Visual Search Handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsAnalyzingImage(true);
    setVisualSearchResults(null);
    
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      const result = await identifyProductFromImage(base64, products);
      setVisualSearchResults(result);
      setIsAnalyzingImage(false);
    };
    reader.readAsDataURL(file);
  };

  // Dashboard Data
  const dashboardData = useMemo(() => {
    const categoryCounts: Record<string, number> = {};
    products.forEach(p => {
      categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
    });
    
    const pieData = Object.entries(categoryCounts).map(([name, value]) => ({ name, value }));
    
    const priceRanges = [
      { name: '0-50', count: 0 },
      { name: '50-100', count: 0 },
      { name: '100-500', count: 0 },
      { name: '500+', count: 0 },
    ];
    
    products.forEach(p => {
      if (p.price <= 50) priceRanges[0].count++;
      else if (p.price <= 100) priceRanges[1].count++;
      else if (p.price <= 500) priceRanges[2].count++;
      else priceRanges[3].count++;
    });

    return { pieData, priceRanges };
  }, [products]);

  const COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899'];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-12 h-12 border-4 border-accent-blue border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!user && !isGuest) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md glass-card rounded-[2.5rem] p-10 shadow-2xl text-center space-y-8"
        >
          <div className="w-20 h-20 premium-gradient rounded-3xl flex items-center justify-center text-white shadow-xl mx-auto">
            <ShoppingBag size={40} />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-display font-bold text-slate-800">Welcome Back</h1>
            <p className="text-slate-500">Sign in to start shopping with MiniShop Pro</p>
          </div>
          
          <div className="space-y-4">
            <button 
              onClick={handleLogin}
              className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 text-slate-700 py-4 rounded-2xl font-bold shadow-sm hover:bg-slate-50 active:scale-95 transition-all"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6 h-6" />
              Sign in with Google
            </button>
            
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-400">Or</span>
              </div>
            </div>

            <button 
              onClick={() => setIsGuest(true)}
              className="w-full flex items-center justify-center gap-3 bg-slate-800 text-white py-4 rounded-2xl font-bold shadow-lg hover:bg-slate-700 active:scale-95 transition-all"
            >
              Continue as Guest
            </button>
          </div>
          
          <p className="text-xs text-slate-400">By signing in, you agree to our Terms & Conditions</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen pb-20">
      {/* Sticky Header */}
      <header className="sticky top-0 z-40 glass-effect px-4 py-4 flex flex-col md:flex-row items-center gap-4 justify-between shadow-sm">
        <div className="flex items-center justify-between w-full md:w-auto">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 premium-gradient rounded-xl flex items-center justify-center text-white shadow-lg">
              <ShoppingBag size={24} />
            </div>
            <h1 className="text-xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600">
              MiniShop Pro
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setActiveTab('cart')}
              className="md:hidden relative p-2 hover:bg-slate-100 rounded-full transition-colors"
            >
              <ShoppingCart className="text-slate-700" size={24} />
              {cartCount > 0 && (
                <motion.span 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 bg-accent-orange text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white"
                >
                  {cartCount}
                </motion.span>
              )}
            </button>
            <button 
              onClick={() => user ? handleLogout() : setIsGuest(false)}
              className="md:hidden p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-700"
              title={user ? "Logout" : "Sign In"}
            >
              {user ? <LogOut size={24} /> : <LogIn size={24} />}
            </button>
          </div>
        </div>

        <div className="relative w-full md:max-w-md flex gap-2">
          <div className="relative flex-1 group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="text-slate-400 group-focus-within:text-accent-blue transition-colors" size={18} />
            </div>
            <input
              type="text"
              placeholder="Search premium products..."
              className="w-full pl-10 pr-24 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-accent-blue/10 focus:border-accent-blue transition-all outline-none shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <button 
                onClick={startVoiceSearch}
                className={`p-2 rounded-xl transition-all ${isListening ? 'bg-rose-500 text-white animate-pulse shadow-lg' : 'hover:bg-slate-100 text-slate-400 hover:text-slate-600'}`}
                title="Voice Search"
              >
                {isListening ? <MicOff size={18} /> : <Mic size={18} />}
              </button>
              <button 
                onClick={() => setIsVisualSearchModalOpen(true)}
                className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-all"
                title="Visual Search"
              >
                <Camera size={18} />
              </button>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <nav className="hidden lg:flex items-center gap-6 mr-4">
            <button 
              onClick={() => setActiveTab('home')}
              className={`text-sm font-bold transition-all ${activeTab === 'home' ? 'text-accent-blue' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Shop
            </button>
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`text-sm font-bold transition-all ${activeTab === 'dashboard' ? 'text-accent-blue' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Dashboard
            </button>
            <button 
              onClick={() => setActiveTab('offers')}
              className={`text-sm font-bold transition-all ${activeTab === 'offers' ? 'text-accent-blue' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Offers
            </button>
          </nav>
          <div className="hidden md:flex items-center gap-3 px-3 py-1.5 bg-slate-100/50 rounded-full border border-slate-200">
            {user ? (
              <>
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || ''} className="w-6 h-6 rounded-full" />
                ) : (
                  <UserIcon size={16} className="text-slate-500" />
                )}
                <span className="text-sm font-medium text-slate-700">{user.displayName?.split(' ')[0]}</span>
                <button onClick={handleLogout} className="p-1 hover:text-red-500 transition-colors" title="Logout">
                  <LogOut size={16} />
                </button>
              </>
            ) : (
              <>
                <UserIcon size={16} className="text-slate-500" />
                <span className="text-sm font-medium text-slate-700">Guest</span>
                <button onClick={() => setIsGuest(false)} className="p-1 hover:text-accent-blue transition-colors" title="Sign In">
                  <LogIn size={16} />
                </button>
              </>
            )}
          </div>

          <button 
            onClick={() => setActiveTab('cart')}
            className="hidden md:block relative p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <ShoppingCart className="text-slate-700" size={24} />
            {cartCount > 0 && (
              <motion.span 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 bg-accent-orange text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white"
              >
                {cartCount}
              </motion.span>
            )}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-display font-bold text-white drop-shadow-sm">Featured Products</h2>
                <button 
                  onClick={() => setIsAddProductModalOpen(true)}
                  className="flex items-center gap-2 bg-white/20 backdrop-blur-md text-white border border-white/30 px-4 py-2 rounded-xl font-medium shadow-md hover:bg-white/30 transition-all active:scale-95"
                >
                  <Plus size={18} />
                  Add Product
                </button>
              </div>

              {/* Category Filters */}
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-6 py-2 rounded-full font-medium transition-all whitespace-nowrap ${
                      activeCategory === cat 
                        ? 'premium-gradient text-white shadow-lg' 
                        : 'bg-white/10 text-white/70 hover:bg-white/20 border border-white/10'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {isLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-64 bg-white/10 animate-pulse rounded-2xl"></div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                  {filteredProducts.map(product => (
                    <motion.div
                      key={product.id}
                      whileHover={{ y: -8 }}
                      className="glass-card rounded-2xl overflow-hidden group"
                    >
                      <div className="aspect-square overflow-hidden relative">
                        <img 
                          src={product.image} 
                          alt={product.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors"></div>
                        <div className="absolute top-3 right-3 flex flex-col gap-2 z-10">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleWishlist(product.id);
                            }}
                            className={`p-2 rounded-full backdrop-blur-md transition-all shadow-sm ${
                              wishlist.includes(product.id) 
                                ? 'bg-rose-500 text-white' 
                                : 'bg-white/80 text-slate-400 hover:text-rose-500'
                            }`}
                          >
                            <Heart size={18} fill={wishlist.includes(product.id) ? "currentColor" : "none"} />
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedProduct(product);
                              setIsQuickViewModalOpen(true);
                            }}
                            className="p-2 bg-white/80 backdrop-blur-md text-slate-400 hover:text-accent-blue rounded-full transition-all shadow-sm"
                            title="Quick View"
                          >
                            <Eye size={18} />
                          </button>
                        </div>
                      </div>
                      <div className="p-4 space-y-2">
                        <h3 className="font-medium text-slate-800 line-clamp-1">{product.name}</h3>
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-accent-blue">${product.price.toFixed(2)}</span>
                          <button 
                            onClick={() => addToCart(product)}
                            className="p-2 bg-slate-100 hover:bg-accent-blue hover:text-white rounded-lg transition-colors active:scale-90"
                          >
                            <Plus size={20} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {!isLoading && filteredProducts.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                  <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center text-white/50">
                    <Search size={40} />
                  </div>
                  <p className="text-white/70 font-medium">No products found matching "{searchQuery}"</p>
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="text-white font-semibold hover:underline"
                  >
                    Clear Search
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'cart' && (
            <motion.div
              key="cart"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-display font-bold text-white drop-shadow-sm">Your Cart</h2>
                {cart.length > 0 && (
                  <button 
                    onClick={() => setIsClearCartModalOpen(true)}
                    className="flex items-center gap-2 bg-red-500/20 backdrop-blur-md text-red-100 border border-red-500/30 px-4 py-2 rounded-xl font-medium shadow-md hover:bg-red-500/30 transition-all active:scale-95"
                  >
                    <Trash2 size={18} />
                    Clear Cart
                  </button>
                )}
              </div>
              
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                  <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center text-white/50">
                    <ShoppingCart size={40} />
                  </div>
                  <p className="text-white/70 font-medium">Your cart is empty</p>
                  <button 
                    onClick={() => setActiveTab('home')}
                    className="text-white font-semibold hover:underline"
                  >
                    Start Shopping
                  </button>
                </div>
              ) : (
                <div className="grid lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-6">
                    <div className="space-y-4">
                      {cart.map(item => (
                        <motion.div 
                          layout
                          key={item.id}
                          className="glass-card p-4 rounded-2xl flex gap-4"
                        >
                          <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0">
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          </div>
                          <div className="flex-1 flex flex-col justify-between py-1">
                            <div className="flex justify-between items-start">
                              <h3 className="font-semibold text-slate-800">{item.name}</h3>
                              <button 
                                onClick={() => removeFromCart(item.id)}
                                className="text-slate-400 hover:text-red-500 transition-colors"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                            <div className="flex justify-between items-end">
                              <span className="text-accent-blue font-bold">${item.price.toFixed(2)}</span>
                              <div className="flex items-center gap-3 bg-slate-50 rounded-lg p-1 border border-slate-200">
                                <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:text-accent-blue"><MinusCircle size={20} /></button>
                                <motion.span 
                                  key={item.quantity}
                                  initial={{ scale: 0.8, opacity: 0.5 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  transition={{ type: "spring", stiffness: 300, damping: 15 }}
                                  className="w-6 text-center font-bold text-sm"
                                >
                                  {item.quantity}
                                </motion.span>
                                <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:text-accent-blue"><PlusCircle size={20} /></button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    {/* Shipping Details Form */}
                    <div className="glass-card p-6 rounded-3xl space-y-6">
                      <div className="flex items-center gap-2 text-slate-800">
                        <Package size={24} className="text-accent-blue" />
                        <h3 className="text-xl font-bold">Shipping Details</h3>
                      </div>
                      <form id="checkout-form" onSubmit={handlePlaceOrder} className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-1 md:col-span-2">
                          <label className="text-sm font-semibold text-slate-600">Full Name</label>
                          <input 
                            type="text" 
                            required
                            value={shippingDetails.name}
                            onChange={(e) => setShippingDetails({...shippingDetails, name: e.target.value})}
                            placeholder="John Doe"
                            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-accent-blue/20 focus:border-accent-blue transition-all"
                          />
                        </div>
                        <div className="space-y-1 md:col-span-2">
                          <label className="text-sm font-semibold text-slate-600">Email Address</label>
                          <input 
                            type="email" 
                            required
                            value={shippingDetails.email}
                            onChange={(e) => setShippingDetails({...shippingDetails, email: e.target.value})}
                            placeholder="john@example.com"
                            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-accent-blue/20 focus:border-accent-blue transition-all"
                          />
                        </div>
                        <div className="space-y-1 md:col-span-2">
                          <label className="text-sm font-semibold text-slate-600">Shipping Address</label>
                          <input 
                            type="text" 
                            required
                            value={shippingDetails.address}
                            onChange={(e) => setShippingDetails({...shippingDetails, address: e.target.value})}
                            placeholder="123 Street Name"
                            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-accent-blue/20 focus:border-accent-blue transition-all"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-sm font-semibold text-slate-600">City</label>
                          <input 
                            type="text" 
                            required
                            value={shippingDetails.city}
                            onChange={(e) => setShippingDetails({...shippingDetails, city: e.target.value})}
                            placeholder="New York"
                            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-accent-blue/20 focus:border-accent-blue transition-all"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-sm font-semibold text-slate-600">ZIP Code</label>
                          <input 
                            type="text" 
                            required
                            value={shippingDetails.zip}
                            onChange={(e) => setShippingDetails({...shippingDetails, zip: e.target.value})}
                            placeholder="10001"
                            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-accent-blue/20 focus:border-accent-blue transition-all"
                          />
                        </div>
                      </form>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="glass-card p-6 rounded-3xl space-y-4">
                      <h3 className="text-xl font-bold text-slate-800">Order Summary</h3>
                      
                      {/* Coupon Section */}
                      <div className="space-y-3 pt-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Have a coupon?</label>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            value={couponInput}
                            onChange={(e) => setCouponInput(e.target.value)}
                            placeholder="Enter code"
                            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue/20"
                          />
                          <button 
                            onClick={handleApplyCoupon}
                            className="bg-slate-800 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-700 transition-colors"
                          >
                            Apply
                          </button>
                        </div>
                        {couponError && <p className="text-xs text-red-500 font-medium">{couponError}</p>}
                        {appliedCoupon && (
                          <motion.div 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center justify-between bg-emerald-50 border border-emerald-100 p-3 rounded-xl"
                          >
                            <div className="flex items-center gap-2">
                              <Tag size={14} className="text-emerald-600" />
                              <span className="text-xs font-bold text-emerald-700">{appliedCoupon.code} Applied</span>
                            </div>
                            <button onClick={removeCoupon} className="text-emerald-700 hover:text-red-500">
                              <X size={14} />
                            </button>
                          </motion.div>
                        )}
                      </div>

                      <div className="space-y-2 text-slate-600 pt-2 border-t border-slate-100">
                        <div className="flex justify-between">
                          <span>Items ({cartCount})</span>
                          <span>${cartTotal.toFixed(2)}</span>
                        </div>
                        {appliedCoupon && (
                          <div className="flex justify-between text-emerald-600 font-medium">
                            <span>Discount ({appliedCoupon.discount})</span>
                            <span>-${discountAmount.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span>Shipping</span>
                          <span className="text-green-600 font-medium">Free</span>
                        </div>
                      </div>
                      <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                        <span className="text-lg font-bold">Total</span>
                        <motion.span 
                          key={finalTotal}
                          initial={{ scale: 1.1, color: '#f59e0b' }}
                          animate={{ scale: 1, color: '#3b82f6' }}
                          transition={{ duration: 0.3 }}
                          className="text-2xl font-bold"
                        >
                          ${finalTotal.toFixed(2)}
                        </motion.span>
                      </div>
                      <button 
                        type="submit"
                        form="checkout-form"
                        className="w-full premium-gradient text-white py-4 rounded-2xl font-bold shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
                      >
                        Place Order
                        <ChevronRight size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'wishlist' && (
            <motion.div
              key="wishlist"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-6"
            >
              <h2 className="text-2xl font-display font-bold text-white drop-shadow-sm">My Wishlist</h2>
              
              {wishlist.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                  <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center text-white/50">
                    <Heart size={40} />
                  </div>
                  <p className="text-white/70 font-medium">Your wishlist is empty</p>
                  <button 
                    onClick={() => setActiveTab('home')}
                    className="text-white font-semibold hover:underline"
                  >
                    Explore Products
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                  {products.filter(p => wishlist.includes(p.id)).map(product => (
                    <motion.div
                      key={product.id}
                      layout
                      className="glass-card rounded-2xl overflow-hidden group"
                    >
                      <div className="aspect-square overflow-hidden relative">
                        <img 
                          src={product.image} 
                          alt={product.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          referrerPolicy="no-referrer"
                        />
                        <button 
                          onClick={() => toggleWishlist(product.id)}
                          className="absolute top-3 right-3 p-2 rounded-full backdrop-blur-md bg-rose-500 text-white shadow-sm z-10"
                        >
                          <Heart size={18} fill="currentColor" />
                        </button>
                      </div>
                      <div className="p-4 space-y-2">
                        <h3 className="font-medium text-slate-800 line-clamp-1">{product.name}</h3>
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-accent-blue">${product.price.toFixed(2)}</span>
                          <button 
                            onClick={() => addToCart(product)}
                            className="p-2 bg-slate-100 hover:bg-accent-blue hover:text-white rounded-lg transition-colors active:scale-90"
                          >
                            <Plus size={20} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-display font-bold text-white drop-shadow-sm">Seller Dashboard</h2>
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl text-white border border-white/20">
                  <TrendingUp size={18} className="text-emerald-400" />
                  <span className="text-sm font-bold">Live Stats</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-card p-6 rounded-3xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Total Products</span>
                    <Package className="text-blue-500" size={20} />
                  </div>
                  <h3 className="text-3xl font-bold text-slate-800">{products.length}</h3>
                  <p className="text-xs text-slate-400">Across {categories.length - 1} categories</p>
                </div>
                <div className="glass-card p-6 rounded-3xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Avg. Price</span>
                    <DollarSign className="text-emerald-500" size={20} />
                  </div>
                  <h3 className="text-3xl font-bold text-slate-800">
                    ${(products.reduce((sum, p) => sum + p.price, 0) / products.length || 0).toFixed(2)}
                  </h3>
                  <p className="text-xs text-slate-400">Competitive market rate</p>
                </div>
                <div className="glass-card p-6 rounded-3xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Categories</span>
                    <BarChart3 className="text-amber-500" size={20} />
                  </div>
                  <h3 className="text-3xl font-bold text-slate-800">{categories.length - 1}</h3>
                  <p className="text-xs text-slate-400">Diverse product range</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="glass-card p-6 rounded-3xl space-y-6">
                  <h4 className="font-bold text-slate-800 flex items-center gap-2">
                    <Tag size={18} className="text-accent-blue" />
                    Inventory by Category
                  </h4>
                  <div className="h-64 w-full relative">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                      <PieChart>
                        <Pie
                          data={dashboardData.pieData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {dashboardData.pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="glass-card p-6 rounded-3xl space-y-6">
                  <h4 className="font-bold text-slate-800 flex items-center gap-2">
                    <DollarSign size={18} className="text-accent-blue" />
                    Price Distribution
                  </h4>
                  <div className="h-64 w-full relative">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                      <BarChart data={dashboardData.priceRanges}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                        <Tooltip 
                          cursor={{fill: '#f8fafc'}}
                          contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                        />
                        <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'orders' && (
            <motion.div
              key="orders"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-20 space-y-4"
            >
              <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center text-white/50">
                <Package size={40} />
              </div>
              <h2 className="text-2xl font-display font-bold text-white">My Orders</h2>
              {isGuest ? (
                <div className="text-center space-y-4">
                  <p className="text-white/70">Sign in to track your orders and view order history.</p>
                  <button 
                    onClick={() => setIsGuest(false)}
                    className="bg-white text-slate-900 px-6 py-2 rounded-xl font-bold hover:bg-slate-100 transition-colors"
                  >
                    Sign In Now
                  </button>
                </div>
              ) : (
                <p className="text-white/70">You haven't placed any orders yet.</p>
              )}
            </motion.div>
          )}

          {activeTab === 'offers' && (
            <motion.div
              key="offers"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <h2 className="text-2xl font-display font-bold text-white drop-shadow-sm">Special Offers</h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                {mockOffers.map(offer => (
                  <motion.div 
                    key={offer.id}
                    whileHover={{ scale: 1.02 }}
                    className="glass-card rounded-3xl overflow-hidden flex flex-col md:flex-row"
                  >
                    <div className={`${offer.color} md:w-32 flex items-center justify-center p-6 text-white`}>
                      <offer.icon size={48} />
                    </div>
                    <div className="p-6 flex-1 space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-xl font-bold text-slate-800">{offer.title}</h3>
                          <p className="text-slate-600 text-sm mt-1">{offer.description}</p>
                        </div>
                        <span className="bg-slate-100 text-slate-800 px-3 py-1 rounded-full text-xs font-bold border border-slate-200">
                          {offer.discount}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between pt-2">
                        <div className="bg-slate-50 border-2 border-dashed border-slate-200 px-4 py-2 rounded-xl">
                          <span className="font-mono font-bold text-slate-700 tracking-wider">{offer.code}</span>
                        </div>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(offer.code);
                            alert(`Code ${offer.code} copied to clipboard!`);
                          }}
                          className="text-accent-blue font-bold hover:underline text-sm"
                        >
                          Copy Code
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6 max-w-2xl mx-auto"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-display font-bold text-white drop-shadow-sm">My Profile</h2>
                <button 
                  onClick={() => signOut(auth)}
                  className="flex items-center gap-2 bg-rose-500/20 backdrop-blur-md px-4 py-2 rounded-xl text-rose-200 border border-rose-500/30 hover:bg-rose-500/30 transition-all"
                >
                  <LogOut size={18} />
                  <span className="text-sm font-bold">Logout</span>
                </button>
              </div>

              <div className="glass-card p-8 rounded-3xl space-y-8">
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-24 h-24 bg-accent-blue/10 rounded-full flex items-center justify-center border-4 border-white/20 relative group">
                    {user?.photoURL ? (
                      <img src={user.photoURL} alt="Profile" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <UserIcon size={48} className="text-accent-blue" />
                    )}
                    <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
                      <Camera size={24} className="text-white" />
                    </div>
                  </div>
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-slate-800">{profileName || user?.displayName || 'Guest User'}</h3>
                    <p className="text-slate-500 text-sm">{user?.email || 'Sign in to sync your data'}</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-500 uppercase tracking-wider ml-1">Full Name</label>
                    <div className="relative">
                      <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="text" 
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        placeholder="Your Name"
                        className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-accent-blue/20 focus:border-accent-blue transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-500 uppercase tracking-wider ml-1">Delivery Address</label>
                    <div className="relative">
                      <Home className="absolute left-4 top-4 text-slate-400" size={18} />
                      <textarea 
                        value={profileAddress}
                        onChange={(e) => setProfileAddress(e.target.value)}
                        placeholder="Enter your full address"
                        rows={3}
                        className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-accent-blue/20 focus:border-accent-blue transition-all resize-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-500 uppercase tracking-wider ml-1">Gender</label>
                    <div className="grid grid-cols-3 gap-3">
                      {['Male', 'Female', 'Other'].map((gender) => (
                        <button
                          key={gender}
                          onClick={() => setProfileGender(gender)}
                          className={`py-3 rounded-2xl font-bold text-sm transition-all border ${
                            profileGender === gender
                              ? 'bg-accent-blue text-white border-accent-blue shadow-md'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          {gender}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button 
                    className="w-full premium-gradient text-white py-4 rounded-2xl font-bold shadow-lg active:scale-95 transition-all mt-4 flex items-center justify-center gap-2"
                    onClick={() => {
                      alert('Profile updated successfully!');
                    }}
                  >
                    <Sparkles size={20} />
                    Save Changes
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 glass-effect px-4 py-3 flex items-center justify-between border-t border-slate-200">
        {[
          { id: 'home', icon: Home },
          { id: 'wishlist', icon: Heart },
          { id: 'cart', icon: ShoppingCart },
          { id: 'orders', icon: Package },
          { id: 'offers', icon: Tag },
          { id: 'profile', icon: UserIcon }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as Tab)}
            className={`relative p-3 rounded-2xl transition-all duration-300 ${
              activeTab === tab.id 
                ? 'bg-accent-blue text-white shadow-lg shadow-blue-200 -translate-y-2' 
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <tab.icon size={24} fill={tab.id === 'wishlist' && wishlist.includes(-1) ? "currentColor" : "none"} />
            {tab.id === 'cart' && cartCount > 0 && activeTab !== 'cart' && (
              <span className="absolute top-1 right-1 bg-accent-orange text-white text-[8px] font-bold w-4 h-4 flex items-center justify-center rounded-full border border-white">
                {cartCount}
              </span>
            )}
            {tab.id === 'wishlist' && wishlist.length > 0 && activeTab !== 'wishlist' && (
              <span className="absolute top-1 right-1 bg-rose-500 text-white text-[8px] font-bold w-4 h-4 flex items-center justify-center rounded-full border border-white">
                {wishlist.length}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Add Product Modal */}
      <AnimatePresence>
        {isAddProductModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddProductModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-display font-bold text-slate-800">Add New Product</h3>
                  <button 
                    onClick={() => setIsAddProductModalOpen(false)}
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleAddProduct} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-slate-600">Product Name</label>
                    <input 
                      type="text" 
                      required
                      value={newProductName}
                      onChange={(e) => setNewProductName(e.target.value)}
                      placeholder="e.g. Wireless Mouse"
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-accent-blue/20 focus:border-accent-blue transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-sm font-semibold text-slate-600">Price ($)</label>
                      <input 
                        type="number" 
                        step="0.01"
                        required
                        value={newProductPrice}
                        onChange={(e) => setNewProductPrice(e.target.value)}
                        placeholder="0.00"
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-accent-blue/20 focus:border-accent-blue transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-semibold text-slate-600">Category</label>
                      <select 
                        value={newProductCategory}
                        onChange={(e) => setNewProductCategory(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-accent-blue/20 focus:border-accent-blue transition-all"
                      >
                        <option value="Electronics">Electronics</option>
                        <option value="Accessories">Accessories</option>
                        <option value="Gaming">Gaming</option>
                        <option value="Fashion">Fashion</option>
                        <option value="Home">Home</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-slate-600">Image URL (Optional)</label>
                    <input 
                      type="url" 
                      value={newProductImage}
                      onChange={(e) => setNewProductImage(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-accent-blue/20 focus:border-accent-blue transition-all"
                    />
                  </div>
                  <button 
                    type="submit"
                    className="w-full premium-gradient text-white py-4 rounded-2xl font-bold shadow-lg active:scale-95 transition-all mt-4"
                  >
                    Create Product
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOrderSuccessModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOrderSuccessModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-8 text-center space-y-6">
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <Package size={40} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-display font-bold text-slate-800">Order Placed!</h3>
                  <p className="text-slate-600">Thank you for your purchase. Your order has been received and is being processed.</p>
                </div>
                <button 
                  onClick={() => {
                    setIsOrderSuccessModalOpen(false);
                    setActiveTab('home');
                  }}
                  className="w-full premium-gradient text-white py-4 rounded-2xl font-bold shadow-lg active:scale-95 transition-all"
                >
                  Back to Shop
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isClearCartModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsClearCartModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-8 text-center space-y-6">
                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
                  <AlertTriangle size={32} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-display font-bold text-slate-800">Clear Cart?</h3>
                  <p className="text-slate-600">Are you sure you want to remove all items from your cart? This action cannot be undone.</p>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setIsClearCartModalOpen(false)}
                    className="flex-1 px-4 py-3 rounded-xl bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={clearCart}
                    className="flex-1 px-4 py-3 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors shadow-lg shadow-red-200"
                  >
                    Clear All
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* AI Chat Widget */}
      <div className="fixed bottom-24 right-6 z-50 flex flex-col items-end gap-4">
        <AnimatePresence>
          {isChatOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20, transformOrigin: 'bottom right' }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              className="w-[350px] md:w-[400px] h-[500px] glass-card rounded-[2rem] shadow-2xl flex flex-col overflow-hidden border-2 border-white/50"
            >
              <div className="premium-gradient p-6 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold">MiniShop AI</h3>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                      <span className="text-[10px] font-medium text-white/80 uppercase tracking-wider">Online Assistant</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => setIsChatOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar bg-slate-50/50">
                {chatMessages.map((msg, idx) => (
                  <motion.div
                    initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={idx}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[85%] p-4 rounded-2xl text-sm ${
                      msg.role === 'user' 
                        ? 'bg-accent-blue text-white rounded-tr-none shadow-md' 
                        : 'bg-white text-slate-700 rounded-tl-none shadow-sm border border-slate-100'
                    }`}>
                      <div className="markdown-body prose prose-sm max-w-none">
                        <Markdown>
                          {msg.text}
                        </Markdown>
                      </div>
                    </div>
                  </motion.div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm border border-slate-100 flex gap-1">
                      <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce"></div>
                      <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                      <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 bg-white border-t border-slate-100">
                <div className="flex gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-200">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Ask me anything..."
                    className="flex-1 bg-transparent px-3 py-2 text-sm focus:outline-none"
                  />
                  <button 
                    onClick={handleSendMessage}
                    disabled={!chatInput.trim() || isTyping}
                    className="p-2 bg-accent-blue text-white rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="w-16 h-16 premium-gradient rounded-3xl flex items-center justify-center text-white shadow-2xl relative group"
        >
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white animate-pulse"></div>
          {isChatOpen ? <X size={28} /> : <MessageSquare size={28} />}
          
          <div className="absolute right-20 bg-slate-800 text-white text-xs font-bold py-2 px-4 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl">
            Chat with AI Assistant
          </div>
        </motion.button>
      </div>

      {/* Visual Search Modal */}
      <AnimatePresence>
        {isVisualSearchModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsVisualSearchModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                      <Camera size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-800">Visual Search</h3>
                      <p className="text-sm text-slate-500">Find products using AI image recognition</p>
                    </div>
                  </div>
                  <button onClick={() => setIsVisualSearchModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="border-2 border-dashed border-slate-200 rounded-3xl p-10 text-center space-y-4 hover:border-accent-blue transition-colors cursor-pointer relative group">
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                      <Plus size={32} className="text-slate-400" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-700">Upload an image</p>
                      <p className="text-xs text-slate-400">Drag and drop or click to browse</p>
                    </div>
                  </div>

                  {isAnalyzingImage && (
                    <div className="flex flex-col items-center justify-center py-6 space-y-3">
                      <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                        className="w-8 h-8 border-3 border-accent-blue border-t-transparent rounded-full"
                      />
                      <p className="text-sm font-medium text-slate-600 animate-pulse">AI is analyzing your image...</p>
                    </div>
                  )}

                  {visualSearchResults && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                    >
                      <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                        <p className="text-sm font-bold text-blue-800">AI Identified:</p>
                        <p className="text-sm text-blue-600">{visualSearchResults.identification}</p>
                      </div>
                      
                      <div className="space-y-3">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Similar Products Found</p>
                        <div className="grid grid-cols-2 gap-3">
                          {products.filter(p => visualSearchResults.recommendedProductIds.includes(p.id)).map(p => (
                            <div key={p.id} className="flex items-center gap-3 p-2 bg-slate-50 rounded-xl border border-slate-100">
                              <img src={p.image} className="w-12 h-12 rounded-lg object-cover" />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-slate-800 truncate">{p.name}</p>
                                <p className="text-[10px] text-accent-blue font-bold">${p.price}</p>
                              </div>
                              <button onClick={() => { addToCart(p); setIsVisualSearchModalOpen(false); }} className="p-1.5 bg-white rounded-lg shadow-sm hover:text-accent-blue">
                                <Plus size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Quick View Modal */}
      <AnimatePresence>
        {isQuickViewModalOpen && selectedProduct && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsQuickViewModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white rounded-[2.5rem] overflow-hidden max-w-4xl w-full shadow-2xl flex flex-col md:flex-row"
            >
              <div className="md:w-1/2 h-64 md:h-auto relative">
                <img 
                  src={selectedProduct.image} 
                  alt={selectedProduct.name} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <button 
                  onClick={() => setIsQuickViewModalOpen(false)}
                  className="absolute top-4 left-4 p-2 bg-white/80 backdrop-blur-md rounded-full text-slate-800 md:hidden"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="md:w-1/2 p-8 flex flex-col justify-between">
                <div className="space-y-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs font-bold text-accent-blue uppercase tracking-wider bg-accent-blue/10 px-3 py-1 rounded-full">
                        {selectedProduct.category}
                      </span>
                      <h2 className="text-3xl font-display font-bold text-slate-900 mt-2">{selectedProduct.name}</h2>
                    </div>
                    <button 
                      onClick={() => setIsQuickViewModalOpen(false)}
                      className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors hidden md:block"
                    >
                      <X size={24} />
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <span className="text-4xl font-bold text-slate-900">${selectedProduct.price.toFixed(2)}</span>
                    <div className="flex items-center gap-1 text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Sparkles key={i} size={16} fill="currentColor" />
                      ))}
                      <span className="text-slate-400 text-sm ml-2">(4.9/5)</span>
                    </div>
                  </div>

                  <p className="text-slate-600 leading-relaxed">
                    Experience premium quality with our {selectedProduct.name}. Designed for style and performance, this {selectedProduct.category.toLowerCase()} item is a perfect addition to your collection.
                  </p>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-sm text-slate-500">
                      <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                      In Stock - Ready to ship
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-500">
                      <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                      Free Express Shipping
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex gap-4">
                  <button 
                    onClick={() => {
                      addToCart(selectedProduct);
                      setIsQuickViewModalOpen(false);
                    }}
                    className="flex-1 bg-accent-blue text-white py-4 rounded-2xl font-bold shadow-lg hover:bg-accent-blue/90 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <ShoppingCart size={20} />
                    Add to Cart
                  </button>
                  <button 
                    onClick={() => toggleWishlist(selectedProduct.id)}
                    className={`p-4 rounded-2xl border-2 transition-all active:scale-95 ${
                      wishlist.includes(selectedProduct.id)
                        ? "bg-rose-50 text-rose-500 border-rose-200"
                        : "bg-white border-slate-200 text-slate-400 hover:border-rose-200 hover:text-rose-500"
                    }`}
                  >
                    <Heart size={24} fill={wishlist.includes(selectedProduct.id) ? "currentColor" : "none"} />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
