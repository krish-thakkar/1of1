import React, { useState, useRef } from 'react';
import { Upload, Send, Image as ImageIcon, Loader } from 'lucide-react';

const PicPrompt = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);
  const chatContainerRef = useRef(null);

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedImage || !prompt) return;

    setIsLoading(true);
    const formData = new FormData();
    formData.append('image', selectedImage);
    formData.append('prompt', prompt);

    try {
      const response = await fetch('http://localhost:5200/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setMessages(prev => [...prev, 
        { role: 'user', content: prompt },
        { role: 'assistant', content: data.response }
      ]);
      setPrompt('');
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinueConversation = async () => {
    if (!prompt) return;

    setIsLoading(true);
    const formData = new FormData();
    formData.append('prompt', prompt);
    formData.append('img_path', selectedImage.name);

    try {
      const response = await fetch('http://localhost:5200/api/conversation', {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setMessages(prev => [...prev, 
        { role: 'user', content: prompt },
        { role: 'assistant', content: data.response }
      ]);
      setPrompt('');
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-10xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="bg-purple-600 rounded-t-xl p-6 mb-6">
          <h1 className="text-4xl font-bold text-white">PicPrompt</h1>
          <p className="text-2xl italic text-purple-100 mt-2">Upload blueprints or diagrams into the app and converse with them to understand better.</p>
        </div>

        {/* Main Content Area */}
        <div className="flex gap-6">
          {/* Left Side - Image Section */}
          <div className="w-1/2 bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-purple-700 mb-4">Image Upload</h2>
            <div 
              className="border-2 border-dashed border-purple-300 rounded-xl p-6 text-center cursor-pointer hover:border-purple-500 transition-colors bg-purple-50"
              onClick={() => fileInputRef.current?.click()}
            >
              {imagePreview ? (
                <div className="relative">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="rounded-lg shadow-md max-w-full mx-auto"
                  />
                  <button 
                    className="absolute top-2 right-2 bg-purple-600 text-white p-2 rounded-full hover:bg-purple-700 shadow-lg transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedImage(null);
                      setImagePreview(null);
                    }}
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div className="space-y-4 py-12">
                  <div className="flex justify-center">
                    <ImageIcon className="h-16 w-16 text-purple-500" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-purple-600 font-medium text-lg">Click to upload an image</p>
                    <p className="text-sm text-purple-400">or drag and drop</p>
                    <p className="text-xs text-purple-300 mt-2">Supports: JPG, PNG, GIF</p>
                  </div>
                </div>
              )}
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleImageUpload}
                accept="image/*"
              />
            </div>
          </div>

          {/* Right Side - Chat Section */}
          <div className="w-2/3 bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-purple-700 mb-4">Chat</h2>
            {/* Messages */}
            <div className="bg-purple-50 rounded-xl p-4 mb-4 h-[calc(70vh-200px)] overflow-y-auto" ref={chatContainerRef}>
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`mb-4 ${
                    message.role === 'user' ? 'text-right' : 'text-left'
                  }`}
                >
                  <div
                    className={`inline-block p-4 rounded-xl shadow-sm max-w-[80%] ${
                      message.role === 'user'
                        ? 'bg-purple-600 text-white'
                        : 'bg-white text-gray-800'
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-center p-4">
                  <Loader className="animate-spin text-purple-600 h-8 w-8" />
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="flex space-x-4">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 p-4 border border-purple-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-purple-50"
              />
              <button
                onClick={selectedImage ? handleSubmit : handleContinueConversation}
                disabled={!prompt || isLoading}
                className="bg-purple-600 text-white px-6 py-4 rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PicPrompt;