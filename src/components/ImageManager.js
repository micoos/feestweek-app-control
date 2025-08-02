import React, { useState, useEffect } from 'react';
import { Upload, Send, Trash2, ArrowLeft, Image as ImageIcon, RefreshCw, Save, Camera } from 'lucide-react';
import config from '../config';

const dbName = 'ImageStore';
const storeName = 'images';

const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      db.createObjectStore(storeName, { keyPath: 'id' });
    };
  });
};

const addImage = async (image) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.add(image);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    transaction.oncomplete = () => db.close();
  });
};

const getAllImages = async () => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    transaction.oncomplete = () => db.close();
  });
};

const deleteImage = async (id) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(id);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    transaction.oncomplete = () => db.close();
  });
};

function ImageManager({ socketClient, onGoBack }) {
  const [images, setImages] = useState([]);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [imageIterationPrompts, setImageIterationPrompts] = useState({});
  const [selectedModel, setSelectedModel] = useState('flux-schnell');
  const [currentResponseId, setCurrentResponseId] = useState(null);
  const [currentImageGenerationCalls, setCurrentImageGenerationCalls] = useState(null);
  const [videoStream, setVideoStream] = useState(null);
  const [iterationPrompt, setIterationPrompt] = useState('');

  useEffect(() => {
    loadImages();
  }, []);

  useEffect(() => {
    if (videoStream) {
      const video = document.querySelector('video');
      if (video) {
        video.srcObject = videoStream;
      }
    }
  }, [videoStream]);

  const loadImages = async () => {
    try {
      const loadedImages = await getAllImages();
      setImages(loadedImages);
    } catch (error) {
      console.error('Error loading images:', error);
    }
  };

  const handleFileUpload = (event) => {
    const files = event.target.files;
    if (files.length > 0) {
      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const newImage = {
            id: Date.now() + Math.random(), // Ensure unique ID
            data: e.target.result.split(',')[1],
            type: file.type
          };
          try {
            await addImage(newImage);
            loadImages();
          } catch (error) {
            console.error('Error saving image:', error);
            alert('Failed to save image. Please try again.');
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = async (imageToRemove) => {
    try {
      await deleteImage(imageToRemove.id);
      loadImages();
      // Clean up iteration prompt
      setImageIterationPrompts(prev => {
        const newPrompts = {...prev};
        delete newPrompts[imageToRemove.id];
        return newPrompts;
      });
    } catch (error) {
      console.error('Error removing image:', error);
      alert('Failed to remove image. Please try again.');
    }
  };
  
  const improveImage = async (image) => {
    const iterPrompt = imageIterationPrompts[image.id];
    if (!iterPrompt || !image.metadata) return;
    
    setIsGenerating(true);
    try {
      const requestBody = {
        prompt: iterPrompt,
        model: 'gpt-image-1',
        size: "1024x1024",
        previous_response: {
          response_id: image.metadata.responseId
        }
      };

      const response = await fetch(`${config.API_BASE_URL}/ai_image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.images && data.images.length > 0) {
          // Create improved image object
          const improvedImage = {
            id: Date.now() + Math.random(),
            data: data.images[0].b64_json,
            type: 'image/png',
            metadata: {
              model: 'gpt-image-1',
              responseId: data.response_id,
              imageGenerationCalls: data.image_generation_calls,
              improvedFrom: image.id
            }
          };
          
          // Add to local state first
          await addImage(improvedImage);
          loadImages();
          
          // Clear the iteration prompt for this image
          setImageIterationPrompts(prev => ({
            ...prev,
            [image.id]: ''
          }));
          
        }
      } else {
        const error = await response.json();
        alert(`Error improving image: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error improving image:', error);
      alert('Error improving image');
    } finally {
      setIsGenerating(false);
    }
  };

  const sendImage = (image) => {
    // Ensure data is properly formatted
    let imageData = image.data;
    
    // If data contains data URL prefix, extract just the base64 part
    if (imageData && imageData.includes('base64,')) {
      imageData = imageData.split('base64,')[1];
    }
    
    socketClient.emit('control_media', { 
      type: 'image', 
      data: imageData 
    });
  };

  const generateImage = async () => {
    if (!prompt) {
      alert('Please enter a prompt for image generation');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('https://api.getimg.ai/v1/flux-schnell/text-to-image', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer key-2nZUawsl2A7Ve31cBZKHo3CVyv3ET65IIWShNlmQ86ZnhJ8Xl6yNChfHFNLwaDGonyel1hmPRnB0Irbs0GyEU1zJy8xfo1MJ',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt })
      });

      if (!response.ok) {
        throw new Error('Failed to generate image');
      }

      const data = await response.json();
      const base64Image = `data:image/jpeg;base64,${data.image}`;
      setGeneratedImage(base64Image);
      
    } catch (error) {
      console.error('Error generating image:', error);
      alert('Failed to generate image. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // New function for OpenAI generation
  const generateWithOpenAI = async (iterationPrompt = null) => {
    const currentPrompt = iterationPrompt || prompt;
    
    if (!currentPrompt && !currentResponseId) {
      alert('Please enter a prompt for image generation');
      return;
    }

    setIsGenerating(true);
    try {
      const requestBody = {
        prompt: currentPrompt,
        model: selectedModel,
        size: "1024x1024",
        quality: selectedModel === 'dall-e-3' ? 'hd' : 'standard',
        n: 1
      };

      // Add previous response for GPT-Image-1 multi-turn
      if (selectedModel === 'gpt-image-1' && currentResponseId && iterationPrompt) {
        requestBody.previous_response = {
          response_id: currentResponseId
        };
      }

      const response = await fetch(`${config.API_BASE_URL}/ai_image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('AI Image response:', data); // Debug log
        console.log('Selected model:', selectedModel); // Debug log
        if (data.images && data.images.length > 0) {
          const imageData = `data:image/png;base64,${data.images[0].b64_json}`;
          setGeneratedImage(imageData);
          
          
          // Store response ID and image generation calls for multi-turn
          if (data.response_id) {
            setCurrentResponseId(data.response_id);
            console.log('Set response ID:', data.response_id);
          }
          if (data.image_generation_calls) {
            setCurrentImageGenerationCalls(data.image_generation_calls);
            console.log('Set image generation calls:', data.image_generation_calls);
          } else {
            console.log('No image_generation_calls in response');
          }
        }
      } else {
        const error = await response.json();
        alert(`Error generating image: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error generating image:', error);
      alert('Error generating image');
    } finally {
      setIsGenerating(false);
    }
  };

  const saveGeneratedImage = async () => {
    if (generatedImage) {
      const newImage = {
        id: Date.now(),
        data: generatedImage.split(',')[1],
        type: 'image/png',
        // Store metadata if it's a GPT-Image-1 generation
        metadata: selectedModel === 'gpt-image-1' && currentImageGenerationCalls ? {
          model: selectedModel,
          responseId: currentResponseId,
          imageGenerationCalls: currentImageGenerationCalls
        } : null
      };
      try {
        await addImage(newImage);
        loadImages();
        setGeneratedImage(null);
        setPrompt('');
        setCurrentResponseId(null);
        setCurrentImageGenerationCalls(null);
        setIterationPrompt('');
      } catch (error) {
        console.error('Error saving generated image:', error);
        alert('Failed to save generated image. Please try again.');
      }
    }
  };

  const deleteGeneratedImage = () => {
    setGeneratedImage(null);
    setPrompt('');
    setIterationPrompt('');
    setCurrentResponseId(null);
    setCurrentImageGenerationCalls(null);
  };

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const openCameraModal = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } }
      });
      setVideoStream(stream);
      setIsCameraModalOpen(true);
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Failed to access camera. Please try again.');
    }
  };

  const closeCameraModal = () => {
    if (videoStream) {
      videoStream.getTracks().forEach(track => track.stop());
      setVideoStream(null);
    }
    setIsCameraModalOpen(false);
  };

  const capturePhoto = () => {
    if (videoStream) {
      const video = document.querySelector('video');
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg');
      const newImage = {
        id: Date.now() + Math.random(),
        data: dataUrl.split(',')[1],
        type: 'image/jpeg'
      };
      addImage(newImage).then(() => {
        loadImages();
        closeCameraModal();
      });
    }
  };

  return (
    <div className="image-manager">
      <div className="image-header">
        <button onClick={onGoBack} className="btn btn-blue go-back-btn">
          <ArrowLeft className="icon" size={20} />
          Go Back
        </button>
        <h3>Image Manager</h3>
      </div>
      <div className="image-inputs">
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileUpload}
          className="file-input"
          id="file-upload"
        />
        <label htmlFor="file-upload" className="btn btn-blue">
          <Upload className="icon" size={20} />
          Upload Image
        </label>
        <button onClick={openCameraModal} className="btn btn-blue">
          <Camera className="icon" size={20} />
          Capture Photo
        </button>
      </div>
      <div className="image-generator">
        <select
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          className="model-select"
        >
          <option value="flux-schnell">Flux Schnell (Fast)</option>
          <option value="dall-e-2">DALL-E 2</option>
          <option value="dall-e-3">DALL-E 3 (HD)</option>
          <option value="gpt-image-1">GPT-Image-1 (AI Agent)</option>
        </select>
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter image generation prompt"
          className="input"
        />
        <button 
          onClick={() => selectedModel === 'flux-schnell' ? generateImage() : generateWithOpenAI()} 
          className="btn btn-green" 
          disabled={isGenerating}
        >
          <ImageIcon className="icon" size={20} />
          {isGenerating ? 'Generating...' : 'Generate Image'}
        </button>
      </div>
      {generatedImage && (
        <div className="generated-image">
          <img src={generatedImage} alt="Generated" className="thumbnail" onClick={openModal} />
          <div className="generated-image-actions">
            <button 
              onClick={() => selectedModel === 'flux-schnell' ? generateImage() : generateWithOpenAI()} 
              className="btn btn-yellow"
            >
              <RefreshCw className="icon" size={20} />
              Opnieuw
            </button>
            <button onClick={saveGeneratedImage} className="btn btn-green">
              <Save className="icon" size={20} />
              Opslaan
            </button>
            <button onClick={deleteGeneratedImage} className="btn btn-red">
              <Trash2 className="icon" size={20} />
              Verwijder
            </button>
          </div>
          {console.log('Render check - Model:', selectedModel, 'Calls:', currentImageGenerationCalls)}
          {selectedModel === 'gpt-image-1' && currentImageGenerationCalls && (
            <div className="iteration-section">
              <input
                type="text"
                value={iterationPrompt}
                onChange={(e) => setIterationPrompt(e.target.value)}
                placeholder="Wat wil je verbeteren aan deze afbeelding?"
                className="input iteration-input"
              />
              <button 
                onClick={() => generateWithOpenAI(iterationPrompt)} 
                className="btn btn-blue"
                disabled={isGenerating || !iterationPrompt}
              >
                <RefreshCw className="icon" size={20} />
                Verbeter
              </button>
            </div>
          )}
        </div>
      )}
      <div className="image-list">
        {images.map((image) => (
          <div key={image.id} className="image-item">
            <img src={`data:${image.type};base64,${image.data}`} alt="Uploaded" className="thumbnail" />
            <div className="image-actions">
              <button onClick={() => sendImage(image)} className="btn btn-green">
                <Send className="icon" size={20} />
                Send
              </button>
              <button onClick={() => removeImage(image)} className="btn btn-red">
                <Trash2 className="icon" size={20} />
                Remove
              </button>
            </div>
            {image.metadata && image.metadata.model === 'gpt-image-1' && (
              <div className="image-iteration">
                <input
                  type="text"
                  value={imageIterationPrompts[image.id] || ''}
                  onChange={(e) => setImageIterationPrompts(prev => ({
                    ...prev,
                    [image.id]: e.target.value
                  }))}
                  placeholder="Verbeter deze afbeelding..."
                  className="input iteration-input"
                />
                <button 
                  onClick={() => improveImage(image)} 
                  className="btn btn-blue"
                  disabled={isGenerating || !imageIterationPrompts[image.id]}
                >
                  <RefreshCw className="icon" size={16} />
                  Verbeter
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
      {isModalOpen && (
        <div className="modal" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <img src={generatedImage} alt="Generated Large" className="large-image" />
            <button onClick={closeModal} className="btn btn-red close-modal">
              Close
            </button>
          </div>
        </div>
      )}
      {isCameraModalOpen && (
        <div className="modal" onClick={closeCameraModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <video autoPlay className="video-feed"></video>
            <button onClick={capturePhoto} className="btn btn-green">
              Capture
            </button>
            <button onClick={closeCameraModal} className="btn btn-red">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ImageManager;