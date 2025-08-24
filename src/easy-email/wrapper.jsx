import React from 'react';
import { createRoot } from 'react-dom/client';
import EasyEmailEditorApp from './Editor.jsx';

// Initialize the React application
function initEasyEmailEditor() {
  const container = document.getElementById('easy-email-editor');
  
  if (!container) {
    console.error('Easy Email Editor: Container element not found');
    return;
  }

  try {
    const root = createRoot(container);
    root.render(<EasyEmailEditorApp />);
    
    console.log('Easy Email Editor initialized successfully');
  } catch (error) {
    console.error('Easy Email Editor initialization failed:', error);
    
    // Show error message in container
    container.innerHTML = `
      <div style="
        display: flex; 
        flex-direction: column; 
        justify-content: center; 
        align-items: center; 
        height: 100vh; 
        color: #e74c3c; 
        text-align: center;
        padding: 20px;
      ">
        <h2>Easy Email Editor Failed to Load</h2>
        <p>Error: ${error.message}</p>
        <p style="margin-top: 20px; font-size: 14px; color: #666;">
          Please check the browser console for more details.
        </p>
      </div>
    `;
  }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initEasyEmailEditor);
} else {
  initEasyEmailEditor();
}

// Also try to initialize after a short delay in case DOM is not fully ready
setTimeout(initEasyEmailEditor, 100);