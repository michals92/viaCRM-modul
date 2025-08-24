<?php

namespace Espo\Modules\ViaCrm\EntryPoints;

use Espo\Core\Api\Request;
use Espo\Core\Api\Response;
use Espo\Core\EntryPoint\EntryPoint;
use Espo\Core\EntryPoint\Traits\NoAuth;

class EasyEmailEditor implements EntryPoint
{
    use NoAuth;

    public function run(Request $request, Response $response): void
    {
        try {
            $templateId = $request->getQueryParam('templateId') ?? 'new';
            $timestamp = date('Y-m-d H:i:s');
            
            $response->writeBody('<!DOCTYPE html>
<html>
<head>
    <title>Easy Email Editor</title>
    <style>
        body { margin: 0; font-family: Arial, sans-serif; }
        .toolbar { background: #2c3e50; color: white; padding: 10px 20px; display: flex; justify-content: space-between; align-items: center; }
        .toolbar button { background: #3498db; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin-left: 10px; }
        .editor-container { height: calc(100vh - 50px); display: flex; }
        .sidebar { width: 250px; background: #f8f9fa; border-right: 1px solid #dee2e6; padding: 20px; overflow-y: auto; }
        .canvas { flex: 1; background: #fff; padding: 20px; overflow-y: auto; }
        .email-preview { max-width: 600px; margin: 0 auto; background: white; box-shadow: 0 0 10px rgba(0,0,0,0.1); min-height: 400px; }
        .email-content { padding: 20px; min-height: 400px; }
        .placeholder { text-align: center; padding: 60px 20px; color: #666; border: 2px dashed #ddd; border-radius: 8px; }
        .component-btn { display: block; width: 100%; margin: 10px 0; padding: 15px; background: white; border: 1px solid #ddd; border-radius: 6px; cursor: pointer; text-align: center; }
        .component-btn:hover { background: #e9ecef; border-color: #3498db; transform: translateY(-1px); }
        .email-component { margin: 10px 0; padding: 10px; border: 1px solid transparent; border-radius: 4px; cursor: pointer; position: relative; transition: all 0.2s; }
        .email-component:hover { border-color: #3498db; background: rgba(52, 152, 219, 0.05); box-shadow: 0 2px 8px rgba(52, 152, 219, 0.2); }
        .editable-content { outline: none; min-height: 20px; }
        .editable-content:focus { background: rgba(52, 152, 219, 0.1); border-radius: 2px; }
    </style>
</head>
<body>
    <div class="toolbar">
        <div>
            <span>Easy Email Editor</span>
            <span style="margin-left: 20px; opacity: 0.7;">Template: ' . htmlspecialchars($templateId) . '</span>
        </div>
        <div>
            <button onclick="saveEditor()">Save</button>
            <button onclick="previewEditor()">Preview</button>
            <button onclick="closeEditor()">Close</button>
        </div>
    </div>
    
    <div class="editor-container">
        <div class="sidebar">
            <h3>📦 Components</h3>
            <button class="component-btn" onclick="addText()">📝 Text Block</button>
            <button class="component-btn" onclick="addButton()">🔘 Button</button>
            <button class="component-btn" onclick="addImage()">🖼️ Image</button>
            <button class="component-btn" onclick="addDivider()">➖ Divider</button>
        </div>
        
        <div class="canvas">
            <div class="email-preview">
                <div class="email-content" id="email-content">
                    <div class="placeholder">
                        <div style="font-size: 48px; margin-bottom: 20px;">📧</div>
                        <h3>Start Building Your Email</h3>
                        <p>Click components on the left to add them</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <script>
        let componentCounter = 0;
        
        function addText() {
            addComponent("text", "<p class=\"editable-content\" contenteditable=\"true\">Sample text content. Click to edit.</p>");
        }
        
        function addButton() {
            addComponent("button", "<div style=\"text-align: center; margin: 20px 0;\"><a href=\"#\" style=\"display: inline-block; background: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;\">Click Here</a></div>");
        }
        
        function addImage() {
            addComponent("image", "<div style=\"text-align: center; margin: 20px 0;\"><div style=\"background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border: 2px dashed #dee2e6; padding: 40px; border-radius: 8px; color: #6c757d; position: relative; overflow: hidden;\"><div style=\"font-size: 48px; margin-bottom: 10px;\">📷</div><div style=\"font-weight: 500; margin-bottom: 5px;\">Image Placeholder</div><small>Click to select and add image URL</small></div></div>");
        }
        
        function addDivider() {
            addComponent("divider", "<hr style=\"border: none; border-top: 2px solid #dee2e6; margin: 30px 0;\" />");
        }
        
        function addComponent(type, content) {
            componentCounter++;
            const emailContent = document.getElementById("email-content");
            const placeholder = emailContent.querySelector(".placeholder");
            
            if (placeholder) {
                placeholder.remove();
            }
            
            const div = document.createElement("div");
            div.className = "email-component";
            div.setAttribute("data-type", type);
            div.setAttribute("data-id", type + "_" + componentCounter);
            div.innerHTML = content;
            
            emailContent.appendChild(div);
            console.log("Added component:", type);
        }
        
        function saveEditor() {
            const emailContent = document.getElementById("email-content");
            const html = emailContent.innerHTML;
            
            const saveData = {
                mjml: JSON.stringify({content: {type: "page"}}),
                html: html,
                subject: "Email Template Subject"
            };
            
            console.log("Saving:", saveData);
            
            if (window.parent !== window) {
                window.parent.postMessage({
                    type: "EASY_EMAIL_SAVE",
                    data: saveData
                }, "*");
            } else {
                alert("Email saved! (Demo mode)");
            }
        }
        
        function previewEditor() {
            const emailContent = document.getElementById("email-content");
            const html = "<!DOCTYPE html><html><head><title>Email Preview</title><style>body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; } .email-container { max-width: 600px; margin: 0 auto; background: white; padding: 20px; }</style></head><body><div class=\"email-container\">" + emailContent.innerHTML + "</div></body></html>";
            
            const newWindow = window.open("", "_blank");
            newWindow.document.write(html);
            newWindow.document.close();
        }
        
        function closeEditor() {
            if (window.parent !== window) {
                window.parent.postMessage({ type: "EASY_EMAIL_CLOSE" }, "*");
            } else {
                window.close();
            }
        }
        
        // Signal ready
        if (window.parent !== window) {
            window.parent.postMessage({
                type: "EASY_EMAIL_READY",
                config: {
                    templateId: "' . htmlspecialchars($templateId) . '",
                    timestamp: "' . $timestamp . '"
                }
            }, "*");
        }
        
        console.log("Simple Easy Email Editor loaded successfully");
    </script>
</body>
</html>');
        } catch (\Exception $e) {
            $response->writeBody('<!DOCTYPE html><html><head><title>Error</title></head><body><h1>Entry Point Error</h1><p>Error: ' . htmlspecialchars($e->getMessage()) . '</p><pre>' . htmlspecialchars($e->getTraceAsString()) . '</pre></body></html>');
        }
    }
}