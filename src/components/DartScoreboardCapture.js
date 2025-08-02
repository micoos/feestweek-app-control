import React, { useState, useRef } from 'react';
import { Camera, RefreshCw, Send } from 'lucide-react';
import config from '../config';

const DartScoreboardCapture = ({ socketClient, onGoBack }) => {
    const [capturedImage, setCapturedImage] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processedData, setProcessedData] = useState(null);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: { ideal: 'environment' } }
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error("Error accessing camera:", err);
        }
    };

    const captureImage = () => {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);
        setCapturedImage(canvas.toDataURL('image/jpeg'));
    };

    const processImage = async () => {
        setIsProcessing(true);
        try {
            // Convert the captured image to base64
            const base64Image = capturedImage.split(',')[1];

            // Structure the request body
            const requestBody = {
                role: "user",
                content: [
                    {
                        type: "text",
                        text: `Extract the information from the image of the dart game and return in JSON format. Information must be in JSON format like this (example info): 
                                {
                                    poule: "Poule 1",
                                    players: ["Emiel Scholing - Lisanne Otten", "Alfred Lip - Erwin Bult"],
                                    score: [2, 1],
                                    "180": [1, 0],
                                    HF: [120, 0],
                                    finished: false
                                }
                            `
                    },
                    {
                        type: "image_url",
                        image_url: {
                            url: `data:image/jpeg;base64,${base64Image}`
                        }
                    }
                ]
            };

            // Send the request to the server
            const response = await fetch(`${config.API_BASE_URL}/ai-prompt`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                throw new Error('Failed to process image');
            }

            const data = await response.json();

            // Assuming the OpenAI response is structured, we'll parse it into our desired format
            const structuredData = parseOpenAIResponse(data);
            setProcessedData(structuredData);
        } catch (error) {
            console.error('Error processing image:', error);
            alert('Failed to process image. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    const parseOpenAIResponse = (openAIData) => {
        // This function will parse the OpenAI response into our desired structure
        // This is a placeholder implementation - you'll need to adjust based on the actual OpenAI response
        return {
            poule: openAIData.poule,
            teams: openAIData.teams.map(team => ({
                name: team.name,
                played: team.played,
                won: team.won,
                lost: team.lost,
                for: team.for,
                against: team.against,
                diff: team.diff,
                '180s': team['180s'],
                highFinish: team.highFinish
            }))
        };
    };

    const sendProcessedData = () => {
        if (processedData) {
            socketClient.emit('dart_update', { 
                data: processedData 
            });
        }
    };

    return (
        <div className="dart-scoreboard-capture">
            <div className="capture-header">
                <button onClick={onGoBack} className="btn btn-blue">
                    Go Back
                </button>
                <h3>Dart Scoreboard Capture</h3>
            </div>
            <div className="camera-container">
                <video ref={videoRef} autoPlay playsInline />
                <canvas ref={canvasRef} style={{ display: 'none' }} />
            </div>
            <div className="capture-controls">
                <button onClick={startCamera} className="btn btn-green">
                    <Camera className="icon" size={20} />
                    Start Camera
                </button>
                <button onClick={captureImage} className="btn btn-blue">
                    <Camera className="icon" size={20} />
                    Capture
                </button>
            </div>
            {capturedImage && (
                <div className="captured-image">
                    <img src={capturedImage} alt="Captured scoreboard" />
                    <button onClick={processImage} className="btn btn-yellow" disabled={isProcessing}>
                        <RefreshCw className="icon" size={20} />
                        {isProcessing ? 'Processing...' : 'Process Image'}
                    </button>
                </div>
            )}
            {processedData && (
                <div className="processed-data">
                    <h4>Processed Data:</h4>
                    <pre>{JSON.stringify(processedData, null, 2)}</pre>
                    <button onClick={sendProcessedData} className="btn btn-green">
                        <Send className="icon" size={20} />
                        Send Data
                    </button>
                </div>
            )}
        </div>
    );
};

export default DartScoreboardCapture;