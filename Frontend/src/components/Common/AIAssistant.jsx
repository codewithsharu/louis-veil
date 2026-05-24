import React, { useState, useRef, useEffect } from 'react';

const AIAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [userPreferences, setUserPreferences] = useState({});
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const [showingRecommendations, setShowingRecommendations] = useState(false);

  // Scroll to bottom function with smooth animation
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Auto scroll when new messages are added
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Clothing shopping questionnaire
  const questionnaire = [
    {
      question: "What occasion are you shopping for?",
      options: ["Wedding", "Party", "Office Wear", "Casual", "Festival", "Sports"]
    },
    {
      question: "What's your preferred style?",
      options: ["Traditional", "Western", "Fusion", "Formal", "Bohemian", "Streetwear"]
    },
    {
      question: "What type of clothing are you looking for?",
      options: ["Dresses", "Tops", "Bottoms", "Suits", "Ethnic Wear", "Outerwear"]
    },
    {
      question: "What's your preferred color palette?",
      options: ["Neutral", "Vibrant", "Pastel", "Dark", "Earthy", "Metallic"]
    },
    {
      question: "What's your budget range?",
      options: ["Under 1K", "1K-3K", "3K-5K", "5K-10K", "Above 10K"]
    },
    {
      question: "What's your preferred fabric?",
      options: ["Cotton", "Silk", "Linen", "Wool", "Synthetic", "Mixed"]
    }
  ];

  // Enhanced products data with images
  const products = [
    { 
      id: 1, 
      name: "Floral Summer Dress", 
      price: "₹2,499", 
      category: "Western", 
      type: "Dresses", 
      occasion: "Party", 
      color: "Vibrant", 
      fabric: "Cotton",
      image: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=500&auto=format&fit=crop&q=60"
    },
    { 
      id: 2, 
      name: "Business Formal Suit", 
      price: "₹8,999", 
      category: "Formal", 
      type: "Suits", 
      occasion: "Office Wear", 
      color: "Dark", 
      fabric: "Mixed",
      image: "https://images.unsplash.com/photo-1593032465175-481ac7f401a0?w=500&auto=format&fit=crop&q=60"
    },
    { 
      id: 3, 
      name: "Designer Saree", 
      price: "₹12,999", 
      category: "Traditional", 
      type: "Ethnic Wear", 
      occasion: "Wedding", 
      color: "Vibrant", 
      fabric: "Silk",
      image: "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=500&auto=format&fit=crop&q=60"
    },
    { 
      id: 4, 
      name: "Casual Denim Jacket", 
      price: "₹3,499", 
      category: "Western", 
      type: "Outerwear", 
      occasion: "Casual", 
      color: "Neutral", 
      fabric: "Mixed",
      image: "https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=500&auto=format&fit=crop&q=60"
    },
    { 
      id: 5, 
      name: "Bohemian Maxi Dress", 
      price: "₹4,999", 
      category: "Bohemian", 
      type: "Dresses", 
      occasion: "Party", 
      color: "Earthy", 
      fabric: "Cotton",
      image: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=500&auto=format&fit=crop&q=60"
    },
    { 
      id: 6, 
      name: "Formal Shirt", 
      price: "₹1,999", 
      category: "Formal", 
      type: "Tops", 
      occasion: "Office Wear", 
      color: "Neutral", 
      fabric: "Cotton" 
    },
    { 
      id: 7, 
      name: "Fusion Kurti", 
      price: "₹2,999", 
      category: "Fusion", 
      type: "Tops", 
      occasion: "Casual", 
      color: "Pastel", 
      fabric: "Cotton" 
    },
    { 
      id: 8, 
      name: "Designer Lehenga", 
      price: "₹15,999", 
      category: "Traditional", 
      type: "Ethnic Wear", 
      occasion: "Wedding", 
      color: "Vibrant", 
      fabric: "Silk" 
    },
    { 
      id: 9, 
      name: "Street Style Hoodie", 
      price: "₹3,999", 
      category: "Streetwear", 
      type: "Outerwear", 
      occasion: "Casual", 
      color: "Dark", 
      fabric: "Mixed" 
    },
    { 
      id: 10, 
      name: "Yoga Pants", 
      price: "₹1,499", 
      category: "Western", 
      type: "Bottoms", 
      occasion: "Sports", 
      color: "Neutral", 
      fabric: "Synthetic" 
    },
    { 
      id: 11, 
      name: "Festival Kurta", 
      price: "₹2,999", 
      category: "Traditional", 
      type: "Tops", 
      occasion: "Festival", 
      color: "Vibrant", 
      fabric: "Cotton" 
    },
    { 
      id: 12, 
      name: "Winter Coat", 
      price: "₹7,999", 
      category: "Western", 
      type: "Outerwear", 
      occasion: "Casual", 
      color: "Dark", 
      fabric: "Wool" 
    },
    { 
      id: 13, 
      name: "Linen Shirt", 
      price: "₹2,499", 
      category: "Western", 
      type: "Tops", 
      occasion: "Casual", 
      color: "Neutral", 
      fabric: "Linen" 
    },
    { 
      id: 14, 
      name: "Party Dress", 
      price: "₹5,999", 
      category: "Western", 
      type: "Dresses", 
      occasion: "Party", 
      color: "Metallic", 
      fabric: "Mixed" 
    },
    { 
      id: 15, 
      name: "Designer Blazer", 
      price: "₹6,999", 
      category: "Formal", 
      type: "Outerwear", 
      occasion: "Office Wear", 
      color: "Neutral", 
      fabric: "Mixed" 
    }
  ];

  const handleOptionSelect = (option) => {
    const currentQuestion = questionnaire[currentStep];
    setUserPreferences(prev => ({
      ...prev,
      [currentQuestion.question]: option
    }));

    // Only add the user's answer
    setMessages(prev => [
      ...prev,
      { text: option, sender: 'user', id: Date.now() + 1 }
    ]);

    if (currentStep < questionnaire.length - 1) {
      setTimeout(() => {
        setCurrentStep(prev => prev + 1);
        setMessages(prev => [
          ...prev,
          { text: questionnaire[currentStep + 1].question, sender: 'assistant', id: Date.now() }
        ]);
      }, 500);
    } else {
      setShowingRecommendations(true);
      // Show recommendations with images
      const recommendations = getRecommendations();
      setTimeout(() => {
        setMessages(prev => [...prev, { 
          text: "Based on your preferences, here are some recommendations:", 
          sender: 'assistant',
          id: Date.now() 
        }]);
        
        // Add recommendations with images
        recommendations.forEach((product, index) => {
          setTimeout(() => {
            setMessages(prev => [...prev, { 
              text: `${product.name} - ${product.price}`, 
              sender: 'assistant',
              isProduct: true,
              productImage: product.image,
              id: Date.now() + index 
            }]);
          }, index * 300);
        });

        // Add close option after recommendations
        setTimeout(() => {
          setMessages(prev => [...prev, {
            text: "Would you like to see more options or close the chat?",
            sender: 'assistant',
            isOptions: true,
            id: Date.now() + 1000
          }]);
        }, recommendations.length * 300 + 500);
      }, 500);
    }
  };

  const getRecommendations = () => {
    return products.filter(product => {
      const preferences = userPreferences;
      return (
        (preferences["What occasion are you shopping for?"] === product.occasion) &&
        (preferences["What's your preferred style?"] === product.category) &&
        (preferences["What type of clothing are you looking for?"] === product.type) &&
        (preferences["What's your preferred color palette?"] === product.color) &&
        (preferences["What's your preferred fabric?"] === product.fabric)
      );
    }).slice(0, 3); // Return top 3 recommendations
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputMessage.trim()) {
      setMessages([...messages, { text: inputMessage, sender: 'user' }]);
      setInputMessage('');
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setCurrentStep(0);
    setMessages([]);
    setUserPreferences({});
    setShowingRecommendations(false);
  };

  const handleShowMore = () => {
    setCurrentStep(0);
    setMessages([{ text: questionnaire[0].question, sender: 'assistant', id: Date.now() }]);
    setUserPreferences({});
    setShowingRecommendations(false);
  };

  const openAssistant = () => {
    setIsOpen(true);
    setMessages([{
      text: questionnaire[0].question,
      sender: 'assistant',
      id: Date.now()
    }]);
    setShowingRecommendations(false);
  };

  return (
    <div className="fixed bottom-24 right-8 z-50">
      {isOpen ? (
        <div className="bg-white rounded-lg shadow-xl w-80 h-[500px] flex flex-col">
          {/* Header */}
          <div className="bg-lv-dark text-white p-3 rounded-t-lg flex justify-between items-center">
            <h3 className="font-serif font-semibold text-sm tracking-wider">Fashion Assistant</h3>
            <button 
              onClick={handleClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>

          {/* Messages */}
          <div 
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-3 space-y-3 scroll-smooth"
          >
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                style={{
                  animation: 'fadeIn 0.3s ease-in-out forwards',
                  opacity: 0,
                  animationFillMode: 'forwards'
                }}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 transform transition-all duration-300 ${
                    message.sender === 'user'
                      ? 'bg-lv-dark text-white hover:bg-lv-dark/90'
                      : message.isProduct
                      ? 'bg-white text-gray-800 border border-gray-200 hover:bg-gray-50'
                      : message.isOptions
                      ? 'bg-lv-cream text-lv-dark border border-lv-gold/30'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  {message.text}
                  {message.isProduct && message.productImage && (
                    <div className="mt-2 rounded-lg overflow-hidden">
                      <img 
                        src={message.productImage} 
                        alt={message.text}
                        className="w-full h-36 object-cover transform hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  {message.isOptions && (
                    <div className="mt-3 space-y-2">
                      <button
                        onClick={handleShowMore}
                        className="w-full bg-lv-dark text-white px-4 py-2 rounded-lg 
                          hover:bg-lv-dark/90 transition-all duration-300 transform 
                          hover:scale-105 active:scale-95"
                      >
                        Show More Options
                      </button>
                      <button
                        onClick={handleClose}
                        className="w-full bg-gray-200 text-gray-800 px-4 py-2 rounded-lg 
                          hover:bg-gray-300 transition-all duration-300 transform 
                          hover:scale-105 active:scale-95"
                      >
                        Close Chat
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Options or Input */}
          {!showingRecommendations && (
            <div className="p-3 border-t bg-white">
              {currentStep < questionnaire.length ? (
                <div className="space-y-2">
                  {questionnaire[currentStep].options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => handleOptionSelect(option)}
                      className="w-full bg-lv-cream hover:bg-lv-gold/10 text-lv-dark px-3 py-1.5 rounded-lg 
                        transition-all duration-300 transform hover:scale-105 active:scale-95
                        shadow-sm hover:shadow-md text-sm"
                    >
                      {option}
                    </button>
                  ))}
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex space-x-2">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Ask anything else..."
                    className="flex-1 border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-lv-gold
                      transition-all duration-300"
                  />
                  <button
                    type="submit"
                    className="bg-lv-dark text-white px-3 py-1.5 rounded-lg hover:bg-lv-dark/90 
                      transition-all duration-300 transform hover:scale-105 active:scale-95"
                  >
                    <i className="fas fa-paper-plane"></i>
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-1.5 md:gap-2.5">
          <button
            onClick={openAssistant}
            aria-label="Open style assistant"
            className="w-10 h-10 md:w-14 md:h-14 bg-lv-dark text-white rounded-full shadow-lg 
              hover:bg-lv-dark/90 hover:scale-110 active:scale-95
              transition-all duration-300 ease-in-out
              flex items-center justify-center
              text-lg md:text-2xl
              opacity-80 hover:opacity-100
              border-2 border-transparent hover:border-lv-gold
              animate-bounce-slow"
          >
            <i className="fas fa-robot"></i>
          </button>
          <p
            onClick={openAssistant}
            className="text-[16px] md:text-[22px] tracking-[0.04em] font-semibold cursor-pointer select-none assistant-label-plain"
          >
            Style Help
          </p>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-in-out forwards;
        }
        .animate-bounce-slow {
          animation: bounce 2s infinite;
        }
        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        .assistant-label-plain {
          font-family: "Cormorant Garamond", Georgia, serif;
          color: #f3c64b;
          text-shadow:
            0 0 1px rgba(0, 0, 0, 0.95),
            0 1px 2px rgba(0, 0, 0, 0.9),
            0 0 1px rgba(255, 255, 255, 0.95),
            0 -1px 2px rgba(255, 255, 255, 0.9),
            0 0 8px rgba(243, 198, 75, 0.55),
            0 0 14px rgba(243, 198, 75, 0.3);
        }
      `}</style>
    </div>
  );
};

export default AIAssistant; 