import React, { useState, useCallback, useEffect, useRef } from 'react';
import { EmailEditor, EmailEditorProvider } from 'easy-email-editor';
import { BlockManager } from 'easy-email-core';
import 'easy-email-editor/lib/style.css';


const defaultData = {
  subject: 'Welcome to our newsletter',
  subTitle: 'Thanks for subscribing!',
  content: {
    type: 'page',
    data: {
      value: {
        breakpoints: {
          480: true
        },
        headStyles: [],
        fonts: [],
        responsive: true,
        generalStyle: {
          'body-background-color': '#f0f0f0',
          'content-background-color': '#ffffff',
          'content-area-background-color': '#ffffff',
          'content-area-width': '600px'
        }
      }
    },
    attributes: {
      'background-color': '#f0f0f0',
      'width': '600px'
    },
    children: [
      {
        type: 'standard_section',
        data: {
          value: {
            noWrap: false
          }
        },
        attributes: {
          'background-color': '#ffffff',
          'padding': '20px'
        },
        children: [
          {
            type: 'standard_column',
            attributes: {
              'width': '100%'
            },
            data: {
              value: {}
            },
            children: [
              {
                type: 'standard_text',
                data: {
                  value: {
                    content: 'Welcome to Easy Email Editor!'
                  }
                },
                attributes: {
                  'font-size': '24px',
                  'font-weight': 'bold',
                  'text-align': 'center',
                  'color': '#333333',
                  'padding': '10px 25px'
                },
                children: []
              }
            ]
          }
        ]
      }
    ]
  }
};

export default function EasyEmailEditorApp() {
  const [data, setData] = useState(defaultData);
  const [loading, setLoading] = useState(true);
  const editorRef = useRef(null);

  // Initialize editor with config from PHP
  useEffect(() => {
    if (window.EASY_EMAIL_CONFIG) {
      const config = window.EASY_EMAIL_CONFIG;
      
      if (config.templateData && config.templateData.bodyMjml) {
        try {
          const templateData = JSON.parse(config.templateData.bodyMjml);
          setData(templateData);
        } catch (e) {
          console.warn('Failed to parse template MJML data:', e);
        }
      }
      
      setLoading(false);
      
      // Notify parent that editor is ready
      if (window.EasyEmailAPI) {
        window.EasyEmailAPI.ready();
      }
    } else {
      setLoading(false);
    }
  }, []);

  // Handle content loading from parent window
  useEffect(() => {
    window.EasyEmailEditor = {
      loadContent: (contentData) => {
        if (contentData.mjml) {
          try {
            const parsedData = typeof contentData.mjml === 'string' 
              ? JSON.parse(contentData.mjml) 
              : contentData.mjml;
            setData(parsedData);
          } catch (e) {
            console.error('Failed to load content:', e);
            // Try to create basic structure from HTML if MJML parse fails
            if (contentData.html) {
              setData({
                ...defaultData,
                subject: contentData.subject || 'Untitled Email',
                content: {
                  ...defaultData.content,
                  children: [{
                    type: 'standard_section',
                    attributes: { 'background-color': '#ffffff', 'padding': '20px' },
                    children: [{
                      type: 'standard_column',
                      attributes: { 'width': '100%' },
                      children: [{
                        type: 'standard_text',
                        data: { value: { content: contentData.html } },
                        attributes: { 'padding': '10px' }
                      }]
                    }]
                  }]
                }
              });
            }
          }
        } else if (contentData.html) {
          // Convert HTML to basic MJML structure
          setData({
            ...defaultData,
            subject: contentData.subject || 'Untitled Email',
            content: {
              ...defaultData.content,
              children: [{
                type: 'standard_section',
                attributes: { 'background-color': '#ffffff', 'padding': '20px' },
                children: [{
                  type: 'standard_column',
                  attributes: { 'width': '100%' },
                  children: [{
                    type: 'standard_text',
                    data: { value: { content: contentData.html } },
                    attributes: { 'padding': '10px' }
                  }]
                }]
              }]
            }
          });
        }
      },
      
      getData: () => {
        return data;
      },
      
      requestSave: () => {
        handleSave();
      }
    };

    // Listen for save requests from parent
    const handleParentMessage = (event) => {
      if (event.data.type === 'EASY_EMAIL_REQUEST_SAVE') {
        handleSave();
      }
    };
    
    window.addEventListener('message', handleParentMessage);

    return () => {
      delete window.EasyEmailEditor;
      window.removeEventListener('message', handleParentMessage);
    };
  }, [data, handleSave]);

  const handleSave = useCallback(() => {
    if (editorRef.current) {
      const exportData = editorRef.current.exportHtml({
        beautify: true,
        minify: false
      });
      
      const saveData = {
        mjml: JSON.stringify(data, null, 2),
        html: exportData.html,
        subject: data.subject || 'Untitled Email',
        json: data
      };

      console.log('Saving email data:', saveData);
      
      if (window.EasyEmailAPI) {
        window.EasyEmailAPI.save(saveData);
      }
    }
  }, [data]);

  const handlePreview = useCallback(() => {
    if (editorRef.current) {
      const exportData = editorRef.current.exportHtml({
        beautify: true,
        minify: false
      });
      
      const previewWindow = window.open('', '_blank');
      if (previewWindow) {
        previewWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Email Preview</title>
          </head>
          <body style="margin: 0; padding: 20px; background: #f0f0f0;">
            ${exportData.html}
          </body>
          </html>
        `);
        previewWindow.document.close();
      }
    }
  }, []);

  const config = {
    height: 'calc(100vh - 60px)',
    onUploadImage: async (file) => {
      try {
        // Upload image to EspoCRM
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch('/api/v1/EasyEmailEditor/action/uploadImage', {
          method: 'POST',
          headers: {
            'X-File-Name': file.name
          },
          body: file
        });
        
        if (!response.ok) {
          throw new Error('Upload failed');
        }
        
        const result = await response.json();
        return {
          url: result.url,
          name: result.name
        };
      } catch (error) {
        console.error('Image upload failed:', error);
        // Fallback to placeholder
        return {
          url: 'https://via.placeholder.com/300x200?text=' + encodeURIComponent(file.name),
          name: file.name
        };
      }
    },
    fontList: [
      'Arial',
      'Helvetica',
      'Georgia',
      'Times New Roman',
      'Courier New',
      'Verdana',
      'Tahoma'
    ],
    mergeTags: [
      {
        name: 'First Name',
        value: '{{firstName}}'
      },
      {
        name: 'Last Name', 
        value: '{{lastName}}'
      },
      {
        name: 'Email',
        value: '{{emailAddress}}'
      },
      {
        name: 'Company',
        value: '{{accountName}}'
      }
    ]
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px',
        color: '#666'
      }}>
        Loading Easy Email Editor...
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Toolbar */}
      <div style={{
        height: '60px',
        background: '#ffffff',
        borderBottom: '1px solid #e1e5e9',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <div style={{ fontSize: '18px', fontWeight: '600', color: '#333' }}>
          Easy Email Editor
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handlePreview}
            style={{
              padding: '8px 16px',
              background: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Preview
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: '8px 16px',
              background: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Save
          </button>
        </div>
      </div>

      {/* Editor */}
      <div style={{ flex: 1 }}>
        <EmailEditorProvider
          config={config}
          data={data}
          onChange={setData}
        >
          <EmailEditor ref={editorRef} />
        </EmailEditorProvider>
      </div>
    </div>
  );
}