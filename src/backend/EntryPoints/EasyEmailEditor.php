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
        $response->setHeader('Content-Type', 'text/html; charset=utf-8');
        
        try {
            $templateId = $request->getQueryParam('templateId') ?? 'new';
            $timestamp = date('Y-m-d H:i:s');
            
            // Generate the mighty email editor
            $html = $this->generateEditorHTML($templateId, $timestamp);
            $response->writeBody($html);

        } catch (\Exception $e) {
            error_log('EasyEmailEditor error: ' . $e->getMessage());
            $response->writeBody('<!DOCTYPE html>
<html><head><title>Error</title></head><body>
<h1>Error</h1><p>Message: ' . htmlspecialchars($e->getMessage()) . '</p>
</body></html>');
        }
    }

    private function generateEditorHTML($templateId, $timestamp): string
    {
        $cssStyles = $this->getAdvancedStyles();
        $htmlStructure = $this->getHTMLStructure($templateId);
        $javascript = $this->getAdvancedJavaScript($templateId, $timestamp);

        return "<!DOCTYPE html>
<html lang=\"en\">
<head>
    <meta charset=\"UTF-8\">
    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">
    <title>🚀 Legendary Email Editor - ViaCRM</title>
    <link rel=\"stylesheet\" href=\"https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css\">
    <link rel=\"stylesheet\" href=\"https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap\">
    <style>{$cssStyles}</style>
</head>
<body>
    {$htmlStructure}
    <script>{$javascript}</script>
</body>
</html>";
    }

    private function getAdvancedStyles(): string
    {
        return '
        :root {
            --primary: #667eea;
            --primary-dark: #5a6fd8;
            --secondary: #764ba2;
            --success: #10b981;
            --warning: #f59e0b;
            --danger: #ef4444;
            --dark: #1f2937;
            --light: #f8fafc;
            --border: #e5e7eb;
            --text: #374151;
            --text-light: #6b7280;
            --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            --gradient: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            overflow: hidden;
            margin: 0;
            padding: 0;
        }

        /* Header */
        .legendary-header {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(20px);
            border-bottom: 1px solid rgba(255, 255, 255, 0.2);
            padding: 12px 24px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-shadow: var(--shadow);
            position: relative;
            z-index: 1000;
        }

        .header-left {
            display: flex;
            align-items: center;
            gap: 20px;
        }

        .legendary-logo {
            display: flex;
            align-items: center;
            gap: 12px;
            font-size: 18px;
            font-weight: 700;
            color: var(--dark);
        }

        .logo-icon {
            width: 32px;
            height: 32px;
            background: var(--gradient);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 16px;
        }

        .header-actions {
            display: flex;
            gap: 8px;
        }

        .legendary-btn {
            padding: 10px 20px;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            display: inline-flex;
            align-items: center;
            gap: 8px;
            position: relative;
            overflow: hidden;
        }

        .legendary-btn::before {
            content: "";
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
            transition: left 0.5s;
        }

        .legendary-btn:hover::before {
            left: 100%;
        }

        .btn-primary {
            background: var(--gradient);
            color: white;
            box-shadow: var(--shadow);
        }

        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: var(--shadow-lg);
        }

        .btn-secondary {
            background: rgba(255, 255, 255, 0.9);
            color: var(--text);
            border: 1px solid var(--border);
        }

        .btn-secondary:hover {
            background: white;
            transform: translateY(-1px);
            box-shadow: var(--shadow);
        }

        /* Main Container */
        .legendary-container {
            display: flex;
            height: calc(100vh - 76px);
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(20px);
            margin: 0;
            border-radius: 0;
            overflow: hidden;
        }

        /* Sidebar */
        .mighty-sidebar {
            width: 420px;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(20px);
            border-right: 1px solid rgba(255, 255, 255, 0.2);
            overflow-y: auto;
            padding: 24px;
            min-width: 420px;
        }

        .sidebar-section {
            margin-bottom: 32px;
        }

        .section-title {
            font-size: 14px;
            font-weight: 700;
            color: var(--text);
            margin-bottom: 16px;
            display: flex;
            align-items: center;
            gap: 10px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .section-icon {
            width: 24px;
            height: 24px;
            background: var(--gradient);
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 12px;
        }

        .component-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 16px;
        }

        .mighty-component {
            background: rgba(255, 255, 255, 0.8);
            border: 2px solid transparent;
            border-radius: 12px;
            padding: 20px;
            cursor: pointer;
            text-align: center;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            overflow: hidden;
            min-height: 100px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
        }

        .mighty-component::before {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: var(--gradient);
            opacity: 0;
            transition: opacity 0.3s;
        }

        .mighty-component:hover::before {
            opacity: 0.1;
        }

        .mighty-component:hover {
            transform: translateY(-4px) scale(1.02);
            border-color: var(--primary);
            box-shadow: var(--shadow-lg);
        }

        .component-icon {
            font-size: 32px;
            color: var(--primary);
            margin-bottom: 12px;
            position: relative;
            z-index: 1;
        }

        .component-label {
            font-size: 14px;
            font-weight: 700;
            color: var(--text);
            position: relative;
            z-index: 1;
            line-height: 1.3;
        }

        /* Canvas */
        .powerful-canvas {
            flex: 1;
            display: flex;
            flex-direction: column;
            background: rgba(255, 255, 255, 0.05);
        }

        .canvas-toolbar {
            background: rgba(255, 255, 255, 0.9);
            backdrop-filter: blur(20px);
            padding: 16px 24px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.2);
            display: flex;
            align-items: center;
            gap: 20px;
        }

        .view-toggle {
            display: flex;
            background: rgba(255, 255, 255, 0.5);
            border-radius: 8px;
            padding: 4px;
        }

        .view-btn {
            padding: 8px 16px;
            border: none;
            border-radius: 6px;
            background: transparent;
            cursor: pointer;
            font-size: 13px;
            font-weight: 600;
            transition: all 0.3s;
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .view-btn.active {
            background: white;
            color: var(--primary);
            box-shadow: var(--shadow);
        }

        .canvas-workspace {
            flex: 1;
            overflow-y: auto;
            overflow-x: hidden;
            padding: 32px;
            display: flex;
            justify-content: center;
            background: radial-gradient(circle at 50% 50%, rgba(255,255,255,0.1) 0%, transparent 50%);
            height: calc(100vh - 152px);
            max-height: calc(100vh - 152px);
        }

        .email-artboard {
            width: 100%;
            max-width: 650px;
            background: white;
            border-radius: 16px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            overflow: visible;
            min-height: 800px;
            margin-bottom: 40px;
            position: relative;
            flex-shrink: 0;
        }

        .email-subject {
            width: 100%;
            padding: 24px;
            border: none;
            border-bottom: 2px solid rgba(102, 126, 234, 0.1);
            font-size: 20px;
            font-weight: 700;
            color: var(--dark);
            outline: none;
            transition: all 0.3s;
            background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
        }

        .email-subject:focus {
            border-bottom-color: var(--primary);
            background: white;
        }

        .email-canvas {
            padding: 32px;
            min-height: 600px;
            position: relative;
            overflow: visible;
        }

        /* Email Components */
        .email-component {
            margin: 20px 0;
            padding: 16px;
            border: 2px dashed transparent;
            border-radius: 12px;
            cursor: move;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            background: rgba(102, 126, 234, 0.02);
        }

        .email-component:hover {
            border-color: var(--primary);
            background: rgba(102, 126, 234, 0.05);
            transform: translateY(-2px);
            box-shadow: var(--shadow);
        }

        .email-component.selected {
            border-color: var(--primary);
            border-style: solid;
            background: rgba(102, 126, 234, 0.08);
            box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
        }

        .component-toolbar {
            position: absolute;
            top: -40px;
            right: 0;
            background: white;
            border: 1px solid var(--border);
            border-radius: 8px;
            padding: 8px;
            display: none;
            gap: 4px;
            box-shadow: var(--shadow-lg);
            z-index: 100;
        }

        .email-component:hover .component-toolbar,
        .email-component.selected .component-toolbar {
            display: flex;
        }

        .toolbar-action {
            padding: 8px;
            background: transparent;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            color: var(--text-light);
            transition: all 0.2s;
        }

        .toolbar-action:hover {
            background: var(--light);
            color: var(--text);
        }

        .toolbar-action.danger:hover {
            background: var(--danger);
            color: white;
        }

        /* Properties Panel */
        .legendary-properties {
            width: 480px;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(20px);
            border-left: 1px solid rgba(255, 255, 255, 0.2);
            padding: 24px;
            overflow-y: auto;
            display: none;
            min-width: 480px;
        }

        .legendary-properties.active {
            display: block;
        }

        .properties-header {
            margin-bottom: 24px;
            padding-bottom: 16px;
            border-bottom: 2px solid var(--border);
        }

        .properties-title {
            font-size: 18px;
            font-weight: 700;
            color: var(--dark);
            margin-bottom: 4px;
        }

        .properties-subtitle {
            font-size: 14px;
            color: var(--text-light);
        }

        .property-group {
            margin-bottom: 24px;
            background: rgba(255, 255, 255, 0.7);
            border: 1px solid var(--border);
            border-radius: 12px;
            overflow: hidden;
            transition: all 0.3s;
        }

        .property-group:hover {
            border-color: var(--primary);
            box-shadow: var(--shadow);
        }

        .property-header {
            padding: 16px;
            background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
            cursor: pointer;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid var(--border);
        }

        .property-header:hover {
            background: rgba(102, 126, 234, 0.05);
        }

        .property-header-title {
            font-size: 16px;
            font-weight: 600;
            color: var(--dark);
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .property-content {
            padding: 20px;
            display: block;
        }

        .property-group.collapsed .property-content {
            display: none;
        }

        .property-row {
            display: flex;
            gap: 12px;
            margin-bottom: 16px;
        }

        .property-col {
            flex: 1;
        }

        .property-label {
            font-size: 12px;
            font-weight: 600;
            color: var(--text);
            margin-bottom: 6px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .property-input {
            width: 100%;
            padding: 12px;
            border: 2px solid var(--border);
            border-radius: 8px;
            font-size: 14px;
            transition: all 0.3s;
            background: rgba(255, 255, 255, 0.8);
        }

        .property-input:focus {
            outline: none;
            border-color: var(--primary);
            box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
            background: white;
        }

        .property-slider {
            -webkit-appearance: none;
            appearance: none;
            height: 6px;
            background: var(--border);
            border-radius: 3px;
            outline: none;
        }

        .property-slider::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 20px;
            height: 20px;
            background: var(--gradient);
            cursor: pointer;
            border-radius: 50%;
            box-shadow: var(--shadow);
        }

        /* Empty State */
        .empty-artboard {
            text-align: center;
            padding: 80px 40px;
            color: var(--text-light);
        }

        .empty-icon {
            font-size: 80px;
            color: var(--border);
            margin-bottom: 24px;
        }

        .empty-title {
            font-size: 24px;
            font-weight: 700;
            color: var(--text);
            margin-bottom: 8px;
        }

        .empty-subtitle {
            font-size: 16px;
            line-height: 1.5;
        }

        /* Animations */
        @keyframes slideIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }

        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }

        .animate-slide-in {
            animation: slideIn 0.3s ease-out;
        }

        .animate-pulse {
            animation: pulse 2s infinite;
        }

        /* Scrollbar */
        ::-webkit-scrollbar {
            width: 8px;
        }

        ::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.1);
        }

        ::-webkit-scrollbar-thumb {
            background: rgba(102, 126, 234, 0.3);
            border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
            background: rgba(102, 126, 234, 0.5);
        }

        /* Mobile Responsive & Modal Optimization */
        @media (max-width: 1600px) {
            .mighty-sidebar {
                width: 380px;
            }
            
            .legendary-properties {
                width: 420px;
            }
            
            .component-grid {
                grid-template-columns: repeat(2, 1fr);
                gap: 12px;
            }
        }
        
        @media (max-width: 1200px) {
            .mighty-sidebar {
                width: 320px;
            }
            
            .legendary-properties {
                width: 360px;
            }
            
            .component-grid {
                grid-template-columns: repeat(2, 1fr);
                gap: 10px;
            }
        }
        
        @media (max-width: 768px) {
            .legendary-container {
                flex-direction: column;
                margin: 4px;
                height: auto;
                min-height: calc(100vh - 76px);
            }
            
            .mighty-sidebar,
            .legendary-properties {
                width: 100%;
                height: auto;
                max-height: 250px;
                order: 2;
            }
            
            .powerful-canvas {
                order: 1;
                min-height: 60vh;
            }
            
            .canvas-workspace {
                padding: 16px;
            }
            
            .email-artboard {
                max-width: 100%;
                margin-bottom: 20px;
            }
            
            .header-actions {
                flex-wrap: wrap;
                gap: 4px;
            }
            
            .legendary-btn {
                padding: 8px 12px;
                font-size: 12px;
            }
        }
        
        /* Extra wide screen optimization */
        @media (min-width: 1800px) {
            .mighty-sidebar {
                width: 500px;
            }
            
            .legendary-properties {
                width: 550px;
            }
            
            .component-grid {
                grid-template-columns: repeat(4, 1fr);
                gap: 20px;
            }
        }';
    }

    private function getHTMLStructure($templateId): string
    {
        return '
        <div class="legendary-header">
            <div class="header-left">
                <div class="legendary-logo">
                    <div class="logo-icon">
                        <i class="fas fa-rocket"></i>
                    </div>
                    <span>Legendary Email Editor</span>
                </div>
                <div class="template-info" style="opacity: 0.7; font-size: 14px;">
                    Template: <strong>' . htmlspecialchars($templateId) . '</strong>
                </div>
            </div>
            <div class="header-actions">
                <button class="legendary-btn btn-secondary" onclick="goBack()">
                    <i class="fas fa-arrow-left"></i> Back
                </button>
                <button class="legendary-btn btn-secondary" onclick="insertVariable()">
                    <i class="fas fa-code"></i> Variables
                </button>
                <button class="legendary-btn btn-secondary" onclick="loadTemplate()">
                    <i class="fas fa-folder-open"></i> Templates
                </button>
                <button class="legendary-btn btn-secondary" onclick="previewEmail()">
                    <i class="fas fa-eye"></i> Preview
                </button>
                <button class="legendary-btn btn-primary" onclick="saveEmail()">
                    <i class="fas fa-save"></i> Save
                </button>
                <button class="legendary-btn btn-secondary" onclick="closeEditor()">
                    <i class="fas fa-times"></i> Close
                </button>
            </div>
        </div>

        <div class="legendary-container">
            <!-- Mighty Sidebar -->
            <div class="mighty-sidebar">
                <div class="sidebar-section">
                    <div class="section-title">
                        <div class="section-icon"><i class="fas fa-cube"></i></div>
                        Basic Components
                    </div>
                    <div class="component-grid">
                        <div class="mighty-component" onclick="addComponent(\'text\')">
                            <div class="component-icon"><i class="fas fa-font"></i></div>
                            <div class="component-label">Text Block</div>
                        </div>
                        <div class="mighty-component" onclick="addComponent(\'button\')">
                            <div class="component-icon"><i class="fas fa-hand-pointer"></i></div>
                            <div class="component-label">Button</div>
                        </div>
                        <div class="mighty-component" onclick="addComponent(\'image\')">
                            <div class="component-icon"><i class="fas fa-image"></i></div>
                            <div class="component-label">Image</div>
                        </div>
                        <div class="mighty-component" onclick="addComponent(\'divider\')">
                            <div class="component-icon"><i class="fas fa-minus"></i></div>
                            <div class="component-label">Divider</div>
                        </div>
                    </div>
                </div>

                <div class="sidebar-section">
                    <div class="section-title">
                        <div class="section-icon"><i class="fas fa-layer-group"></i></div>
                        Layout & Structure
                    </div>
                    <div class="component-grid">
                        <div class="mighty-component" onclick="addComponent(\'columns\')">
                            <div class="component-icon"><i class="fas fa-columns"></i></div>
                            <div class="component-label">Columns</div>
                        </div>
                        <div class="mighty-component" onclick="addComponent(\'spacer\')">
                            <div class="component-icon"><i class="fas fa-arrows-alt-v"></i></div>
                            <div class="component-label">Spacer</div>
                        </div>
                        <div class="mighty-component" onclick="addComponent(\'hero\')">
                            <div class="component-icon"><i class="fas fa-flag"></i></div>
                            <div class="component-label">Hero Section</div>
                        </div>
                        <div class="mighty-component" onclick="addComponent(\'card\')">
                            <div class="component-icon"><i class="fas fa-id-card"></i></div>
                            <div class="component-label">Card</div>
                        </div>
                    </div>
                </div>

                <div class="sidebar-section">
                    <div class="section-title">
                        <div class="section-icon"><i class="fas fa-magic"></i></div>
                        Advanced Elements
                    </div>
                    <div class="component-grid">
                        <div class="mighty-component" onclick="addComponent(\'social\')">
                            <div class="component-icon"><i class="fas fa-share-alt"></i></div>
                            <div class="component-label">Social Links</div>
                        </div>
                        <div class="mighty-component" onclick="addComponent(\'video\')">
                            <div class="component-icon"><i class="fas fa-play"></i></div>
                            <div class="component-label">Video</div>
                        </div>
                        <div class="mighty-component" onclick="addComponent(\'table\')">
                            <div class="component-icon"><i class="fas fa-table"></i></div>
                            <div class="component-label">Table</div>
                        </div>
                        <div class="mighty-component" onclick="addComponent(\'signature\')">
                            <div class="component-icon"><i class="fas fa-signature"></i></div>
                            <div class="component-label">Signature</div>
                        </div>
                    </div>
                </div>

                <div class="sidebar-section" style="background: rgba(102, 126, 234, 0.1); padding: 20px; border-radius: 12px;">
                    <div class="section-title">
                        <div class="section-icon"><i class="fas fa-code"></i></div>
                        Quick Variables
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
                        <span class="variable-tag" onclick="insertQuickVariable(\'{{name}}\')">{{name}}</span>
                        <span class="variable-tag" onclick="insertQuickVariable(\'{{email}}\')">{{email}}</span>
                        <span class="variable-tag" onclick="insertQuickVariable(\'{{company}}\')">{{company}}</span>
                        <span class="variable-tag" onclick="insertQuickVariable(\'{{date}}\')">{{date}}</span>
                        <span class="variable-tag" onclick="insertQuickVariable(\'{{firstName}}\')">{{firstName}}</span>
                        <span class="variable-tag" onclick="insertQuickVariable(\'{{lastName}}\')">{{lastName}}</span>
                        <span class="variable-tag" onclick="insertQuickVariable(\'{{phone}}\')">{{phone}}</span>
                        <span class="variable-tag" onclick="insertQuickVariable(\'{{website}}\')">{{website}}</span>
                    </div>
                </div>
            </div>

            <!-- Powerful Canvas -->
            <div class="powerful-canvas">
                <div class="canvas-toolbar">
                    <div class="view-toggle">
                        <button class="view-btn active" onclick="setViewMode(\'desktop\')">
                            <i class="fas fa-desktop"></i> Desktop
                        </button>
                        <button class="view-btn" onclick="setViewMode(\'mobile\')">
                            <i class="fas fa-mobile-alt"></i> Mobile
                        </button>
                    </div>
                    <button class="legendary-btn btn-secondary" onclick="undoAction()">
                        <i class="fas fa-undo"></i> Undo
                    </button>
                    <button class="legendary-btn btn-secondary" onclick="redoAction()">
                        <i class="fas fa-redo"></i> Redo
                    </button>
                    <button class="legendary-btn btn-secondary" onclick="clearAll()">
                        <i class="fas fa-trash"></i> Clear All
                    </button>
                    <button class="legendary-btn btn-secondary" onclick="toggleProperties()">
                        <i class="fas fa-cog"></i> Properties
                    </button>
                </div>

                <div class="canvas-workspace" id="canvas-workspace">
                    <div class="email-artboard" id="email-artboard">
                        <input type="text" class="email-subject" id="email-subject" 
                               placeholder="✨ Enter your legendary email subject..." 
                               value="Welcome to the Future of Email Marketing">
                        <div class="email-canvas" id="email-canvas">
                            <div class="empty-artboard">
                                <div class="empty-icon"><i class="fas fa-rocket"></i></div>
                                <h3 class="empty-title">Ready to Create Something Legendary?</h3>
                                <p class="empty-subtitle">Drag components from the sidebar to start building your masterpiece email</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Legendary Properties Panel -->
            <div class="legendary-properties" id="properties-panel">
                <div class="properties-header">
                    <h3 class="properties-title">🎨 Component Properties</h3>
                    <p class="properties-subtitle">Customize your selection</p>
                </div>
                <div id="properties-content">
                    <div style="text-align: center; padding: 40px 20px; color: #6b7280;">
                        <i class="fas fa-mouse-pointer" style="font-size: 48px; margin-bottom: 16px; opacity: 0.3;"></i>
                        <p>Select a component to edit its properties</p>
                    </div>
                </div>
            </div>
        </div>

        <style>
        .variable-tag {
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(255, 255, 255, 0.8);
            border: 1px solid rgba(102, 126, 234, 0.3);
            padding: 10px 12px;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.2s;
            color: var(--primary);
            min-height: 40px;
            text-align: center;
        }

        .variable-tag:hover {
            background: var(--primary);
            color: white;
            transform: translateY(-1px);
        }
        </style>';
    }

    private function getAdvancedJavaScript($templateId, $timestamp): string
    {
        return '
        // 🚀 LEGENDARY EMAIL EDITOR - ADVANCED JAVASCRIPT ENGINE
        let componentCounter = 0;
        let selectedComponent = null;
        let emailHistory = [];
        let historyIndex = -1;
        let isDragging = false;

        // Initialize the mighty editor
        document.addEventListener("DOMContentLoaded", function() {
            console.log("🚀 Initializing Legendary Email Editor...");
            initializeEditor();
            setupDragAndDrop();
            setupKeyboardShortcuts();
            notifyParentReady();
            showWelcomeAnimation();
        });

        function initializeEditor() {
            const emailCanvas = document.getElementById("email-canvas");
            if (emailCanvas.querySelector(".empty-artboard")) {
                saveHistory();
            }
        }

        function showWelcomeAnimation() {
            const components = document.querySelectorAll(".mighty-component");
            components.forEach((comp, index) => {
                setTimeout(() => {
                    comp.classList.add("animate-slide-in");
                }, index * 50);
            });
        }

        // 🎯 COMPONENT MANAGEMENT SYSTEM
        function addComponent(type) {
            const emailCanvas = document.getElementById("email-canvas");
            const emptyState = emailCanvas.querySelector(".empty-artboard");
            
            if (emptyState) {
                emptyState.remove();
            }

            componentCounter++;
            const componentId = `legendary-${type}-${componentCounter}`;
            const component = document.createElement("div");
            component.className = "email-component animate-slide-in";
            component.setAttribute("data-type", type);
            component.setAttribute("data-id", componentId);
            component.draggable = true;

            // Add component toolbar
            const toolbar = document.createElement("div");
            toolbar.className = "component-toolbar";
            toolbar.innerHTML = `
                <button class="toolbar-action" onclick="duplicateComponent(\'${componentId}\')" title="Duplicate">
                    <i class="fas fa-copy"></i>
                </button>
                <button class="toolbar-action" onclick="moveComponent(\'${componentId}\', \'up\')" title="Move Up">
                    <i class="fas fa-arrow-up"></i>
                </button>
                <button class="toolbar-action" onclick="moveComponent(\'${componentId}\', \'down\')" title="Move Down">
                    <i class="fas fa-arrow-down"></i>
                </button>
                <button class="toolbar-action danger" onclick="deleteComponent(\'${componentId}\')" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            `;

            // Generate component content
            let content = generateComponentContent(type, componentId);
            component.innerHTML = toolbar.outerHTML + content;

            // Setup event listeners
            setupComponentEvents(component, componentId);
            
            emailCanvas.appendChild(component);
            selectComponent(componentId);
            saveHistory();
            updateArtboardHeight();
            
            // Show success notification
            showNotification("Component added successfully! ✨", "success");
        }
        
        function updateArtboardHeight() {
            const emailCanvas = document.getElementById("email-canvas");
            const emailArtboard = document.getElementById("email-artboard");
            
            // Calculate the actual content height
            const contentHeight = emailCanvas.scrollHeight + 100; // Add some padding
            const minHeight = 800; // Minimum height
            
            const newHeight = Math.max(contentHeight, minHeight);
            emailArtboard.style.minHeight = newHeight + "px";
        }

        function generateComponentContent(type, componentId) {
            switch(type) {
                case "text":
                    return `<div class="text-component" contenteditable="true" 
                                 style="outline: none; min-height: 50px; line-height: 1.6; padding: 12px; border-radius: 8px;"
                                 onblur="saveHistory()">
                        <p style="margin: 0;">Click here to edit your text. You can make it <strong>bold</strong>, <em>italic</em>, or add links!</p>
                    </div>`;
                
                case "button":
                    return `<div style="text-align: center; margin: 24px 0;">
                        <a href="#" class="legendary-email-button" 
                           style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                                  color: white; padding: 16px 32px; text-decoration: none; border-radius: 12px; 
                                  font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
                                  transition: all 0.3s; border: none; cursor: pointer;"
                           contenteditable="true">🚀 Call to Action</a>
                    </div>`;
                
                case "image":
                    return `<div class="image-component" style="text-align: center; margin: 24px 0;">
                        <div class="image-placeholder" onclick="selectImage(\'${componentId}\')"
                             style="background: linear-gradient(135deg, #f8fafc 0%, #e5e7eb 100%); 
                                    border: 3px dashed #d1d5db; padding: 60px 40px; border-radius: 16px; 
                                    cursor: pointer; transition: all 0.3s;">
                            <i class="fas fa-cloud-upload-alt" style="font-size: 48px; color: #9ca3af; margin-bottom: 16px;"></i>
                            <div style="font-size: 18px; font-weight: 600; color: #6b7280; margin-bottom: 8px;">
                                Add Your Image
                            </div>
                            <small style="color: #9ca3af;">Click to upload or enter URL</small>
                        </div>
                    </div>`;
                
                case "divider":
                    return `<div class="divider-component" style="margin: 40px 0;">
                        <hr style="border: none; height: 3px; background: linear-gradient(to right, transparent, #667eea, transparent); border-radius: 2px;">
                    </div>`;
                
                case "spacer":
                    return `<div class="spacer-component" style="height: 60px; background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%); border-radius: 8px; position: relative; overflow: hidden;">
                        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: rgba(102, 126, 234, 0.5); font-size: 14px; font-weight: 600;">SPACER</div>
                    </div>`;
                
                case "columns":
                    return `<div style="display: flex; gap: 24px; margin: 24px 0;">
                        <div style="flex: 1; background: rgba(102, 126, 234, 0.05); padding: 24px; border-radius: 12px; border: 2px dashed rgba(102, 126, 234, 0.2);">
                            <div contenteditable="true" style="outline: none; min-height: 80px;">
                                <h3 style="margin: 0 0 12px 0; color: #374151;">Column 1</h3>
                                <p style="margin: 0; color: #6b7280;">Add your content here...</p>
                            </div>
                        </div>
                        <div style="flex: 1; background: rgba(118, 75, 162, 0.05); padding: 24px; border-radius: 12px; border: 2px dashed rgba(118, 75, 162, 0.2);">
                            <div contenteditable="true" style="outline: none; min-height: 80px;">
                                <h3 style="margin: 0 0 12px 0; color: #374151;">Column 2</h3>
                                <p style="margin: 0; color: #6b7280;">Add your content here...</p>
                            </div>
                        </div>
                    </div>`;
                
                case "hero":
                    return `<div class="hero-component" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                                 color: white; padding: 80px 40px; text-align: center; border-radius: 16px; margin: 24px 0; position: relative; overflow: hidden;">
                        <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: url(\'data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><defs><pattern id=\"grain\" width=\"100\" height=\"100\" patternUnits=\"userSpaceOnUse\"><circle cx=\"50\" cy=\"50\" r=\"1\" fill=\"%23ffffff\" opacity=\"0.1\"/></pattern></defs><rect width=\"100\" height=\"100\" fill=\"url(%23grain)\"/></svg>\'); opacity: 0.3;"></div>
                        <div style="position: relative; z-index: 1;">
                            <h1 contenteditable="true" style="margin: 0 0 20px 0; font-size: 42px; font-weight: 800; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                🚀 Revolutionary Email Marketing
                            </h1>
                            <p contenteditable="true" style="font-size: 20px; margin: 0 0 32px 0; opacity: 0.9; line-height: 1.5;">
                                Create stunning emails that captivate and convert with our legendary editor
                            </p>
                            <a href="#" style="display: inline-block; background: rgba(255,255,255,0.9); color: #667eea; 
                               padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; 
                               box-shadow: 0 8px 25px rgba(0,0,0,0.2); transition: all 0.3s;" 
                               contenteditable="true">Get Started Now</a>
                        </div>
                    </div>`;
                
                case "card":
                    return `<div class="card-component" style="border: 1px solid #e5e7eb; border-radius: 16px; padding: 32px; margin: 24px 0; background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%); box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                        <h3 contenteditable="true" style="margin: 0 0 16px 0; font-size: 24px; font-weight: 700; color: #1f2937;">
                            ✨ Amazing Feature
                        </h3>
                        <p contenteditable="true" style="color: #6b7280; line-height: 1.6; margin: 0 0 24px 0;">
                            Describe your amazing feature or benefit here. Make it compelling and engaging for your readers.
                        </p>
                        <a href="#" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                           color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;" 
                           contenteditable="true">Learn More</a>
                    </div>`;
                
                case "social":
                    return `<div class="social-component" style="text-align: center; padding: 40px 0; background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%); border-radius: 12px; margin: 24px 0;">
                        <p style="margin: 0 0 20px 0; color: #6b7280; font-size: 16px; font-weight: 600;">Follow Us & Stay Connected</p>
                        <div style="display: flex; justify-content: center; gap: 16px; flex-wrap: wrap;">
                            <a href="#" style="display: inline-flex; align-items: center; justify-content: center; width: 48px; height: 48px; background: #1da1f2; color: white; border-radius: 12px; text-decoration: none; transition: all 0.3s; box-shadow: 0 4px 12px rgba(29, 161, 242, 0.3);">
                                <i class="fab fa-twitter" style="font-size: 20px;"></i>
                            </a>
                            <a href="#" style="display: inline-flex; align-items: center; justify-content: center; width: 48px; height: 48px; background: #3b5998; color: white; border-radius: 12px; text-decoration: none; transition: all 0.3s; box-shadow: 0 4px 12px rgba(59, 89, 152, 0.3);">
                                <i class="fab fa-facebook-f" style="font-size: 20px;"></i>
                            </a>
                            <a href="#" style="display: inline-flex; align-items: center; justify-content: center; width: 48px; height: 48px; background: #e4405f; color: white; border-radius: 12px; text-decoration: none; transition: all 0.3s; box-shadow: 0 4px 12px rgba(228, 64, 95, 0.3);">
                                <i class="fab fa-instagram" style="font-size: 20px;"></i>
                            </a>
                            <a href="#" style="display: inline-flex; align-items: center; justify-content: center; width: 48px; height: 48px; background: #0077b5; color: white; border-radius: 12px; text-decoration: none; transition: all 0.3s; box-shadow: 0 4px 12px rgba(0, 119, 181, 0.3);">
                                <i class="fab fa-linkedin-in" style="font-size: 20px;"></i>
                            </a>
                        </div>
                    </div>`;
                
                case "table":
                    return `<div class="table-component" style="margin: 24px 0; overflow-x: auto; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                        <table style="width: 100%; border-collapse: collapse; background: white;">
                            <thead>
                                <tr style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                                    <th contenteditable="true" style="padding: 16px; text-align: left; color: white; font-weight: 600;">Feature</th>
                                    <th contenteditable="true" style="padding: 16px; text-align: left; color: white; font-weight: 600;">Basic</th>
                                    <th contenteditable="true" style="padding: 16px; text-align: left; color: white; font-weight: 600;">Pro</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr style="border-bottom: 1px solid #e5e7eb;">
                                    <td contenteditable="true" style="padding: 16px; color: #374151;">Email Templates</td>
                                    <td contenteditable="true" style="padding: 16px; color: #10b981;">✓ 10</td>
                                    <td contenteditable="true" style="padding: 16px; color: #10b981;">✓ Unlimited</td>
                                </tr>
                                <tr style="border-bottom: 1px solid #e5e7eb;">
                                    <td contenteditable="true" style="padding: 16px; color: #374151;">Advanced Editor</td>
                                    <td contenteditable="true" style="padding: 16px; color: #ef4444;">✗</td>
                                    <td contenteditable="true" style="padding: 16px; color: #10b981;">✓</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>`;
                
                case "signature":
                    return `<div class="signature-component" style="border-top: 3px solid #667eea; margin: 40px 0 0 0; padding: 32px 0;">
                        <div style="display: flex; align-items: center; gap: 24px;">
                            <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 16px; display: flex; align-items: center; justify-content: center; color: white; font-size: 32px; font-weight: 700; box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);">
                                <i class="fas fa-user"></i>
                            </div>
                            <div style="flex: 1;">
                                <h4 contenteditable="true" style="margin: 0 0 8px 0; font-size: 20px; font-weight: 700; color: #1f2937;">
                                    John Smith
                                </h4>
                                <p contenteditable="true" style="margin: 0 0 8px 0; color: #667eea; font-weight: 600;">
                                    Senior Email Marketing Specialist
                                </p>
                                <p contenteditable="true" style="margin: 0; color: #6b7280; font-size: 14px;">
                                    📧 john.smith@company.com | 📱 +1 (555) 123-4567 | 🌐 company.com
                                </p>
                            </div>
                        </div>
                    </div>`;
                
                case "video":
                    return `<div class="video-component" style="text-align: center; margin: 24px 0;">
                        <div style="background: linear-gradient(135deg, #1f2937 0%, #374151 100%); border-radius: 16px; padding: 60px 40px; position: relative; overflow: hidden;">
                            <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; opacity: 0.1; background: url(\'data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><defs><pattern id=\"video-pattern\" width=\"20\" height=\"20\" patternUnits=\"userSpaceOnUse\"><circle cx=\"10\" cy=\"10\" r=\"1\" fill=\"%23ffffff\"/></pattern></defs><rect width=\"100\" height=\"100\" fill=\"url(%23video-pattern)\"/></svg>\');"></div>
                            <div style="position: relative; z-index: 1;">
                                <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); border-radius: 50%; margin: 0 auto 20px auto; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 25px rgba(239, 68, 68, 0.4);">
                                    <i class="fas fa-play" style="color: white; font-size: 32px; margin-left: 4px;"></i>
                                </div>
                                <h3 contenteditable="true" style="color: white; margin: 0 0 12px 0; font-size: 22px; font-weight: 700;">
                                    🎬 Watch Our Story
                                </h3>
                                <p contenteditable="true" style="color: rgba(255,255,255,0.8); margin: 0 0 24px 0;">
                                    Discover how our solution can transform your business
                                </p>
                                <input type="text" placeholder="Enter video URL..." style="background: rgba(255,255,255,0.1); border: 2px solid rgba(255,255,255,0.2); color: white; padding: 12px; border-radius: 8px; width: 100%; max-width: 300px; text-align: center;" onclick="this.select()">
                            </div>
                        </div>
                    </div>`;
                
                default:
                    return `<div style="padding: 20px; text-align: center; color: #6b7280;">
                        <i class="fas fa-question-circle" style="font-size: 24px; margin-bottom: 8px;"></i>
                        <p>Unknown component: ${type}</p>
                    </div>`;
            }
        }

        function setupComponentEvents(component, componentId) {
            // Drag events
            component.addEventListener("dragstart", (e) => {
                isDragging = true;
                component.classList.add("dragging");
                e.dataTransfer.effectAllowed = "move";
                e.dataTransfer.setData("componentId", componentId);
            });

            component.addEventListener("dragend", () => {
                isDragging = false;
                component.classList.remove("dragging");
            });

            // Click to select
            component.addEventListener("click", (e) => {
                e.stopPropagation();
                selectComponent(componentId);
            });
        }

        // 🎨 COMPONENT SELECTION & PROPERTIES
        function selectComponent(componentId) {
            // Remove previous selection
            document.querySelectorAll(".email-component").forEach(c => {
                c.classList.remove("selected");
            });

            // Select new component
            const component = document.querySelector(`[data-id="${componentId}"]`);
            if (component) {
                component.classList.add("selected");
                selectedComponent = componentId;
                showAdvancedProperties(component);
            }
        }

        function showAdvancedProperties(component) {
            const panel = document.getElementById("properties-panel");
            const content = document.getElementById("properties-content");
            const type = component.getAttribute("data-type");

            panel.classList.add("active");
            
            let propertiesHTML = generatePropertiesPanel(type, component);
            content.innerHTML = propertiesHTML;
            
            // Initialize property listeners
            setTimeout(() => initializePropertyListeners(component, type), 100);
        }

        function generatePropertiesPanel(type, component) {
            switch(type) {
                case "text":
                    return `
                        <div class="property-group">
                            <div class="property-header" onclick="togglePropertyGroup(this)">
                                <div class="property-header-title">
                                    <i class="fas fa-font"></i> Typography
                                </div>
                                <i class="fas fa-chevron-down"></i>
                            </div>
                            <div class="property-content">
                                <div class="property-row">
                                    <div class="property-col">
                                        <div class="property-label">Font Size</div>
                                        <input type="range" class="property-input property-slider" id="font-size" min="12" max="48" value="16">
                                        <div style="text-align: center; font-size: 12px; color: #6b7280; margin-top: 4px;">
                                            <span id="font-size-value">16px</span>
                                        </div>
                                    </div>
                                </div>
                                <div class="property-row">
                                    <div class="property-col">
                                        <div class="property-label">Font Weight</div>
                                        <select class="property-input" id="font-weight">
                                            <option value="300">Light</option>
                                            <option value="400" selected>Normal</option>
                                            <option value="600">Semi Bold</option>
                                            <option value="700">Bold</option>
                                        </select>
                                    </div>
                                    <div class="property-col">
                                        <div class="property-label">Line Height</div>
                                        <input type="number" class="property-input" id="line-height" value="1.6" step="0.1" min="1" max="3">
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="property-group">
                            <div class="property-header" onclick="togglePropertyGroup(this)">
                                <div class="property-header-title">
                                    <i class="fas fa-palette"></i> Colors & Effects
                                </div>
                                <i class="fas fa-chevron-down"></i>
                            </div>
                            <div class="property-content">
                                <div class="property-row">
                                    <div class="property-col">
                                        <div class="property-label">Text Color</div>
                                        <input type="color" class="property-input" id="text-color" value="#374151">
                                    </div>
                                    <div class="property-col">
                                        <div class="property-label">Background</div>
                                        <input type="color" class="property-input" id="bg-color" value="#ffffff">
                                    </div>
                                </div>
                            </div>
                        </div>`;
                        
                case "button":
                    return `
                        <div class="property-group">
                            <div class="property-header" onclick="togglePropertyGroup(this)">
                                <div class="property-header-title">
                                    <i class="fas fa-hand-pointer"></i> Button Content
                                </div>
                                <i class="fas fa-chevron-down"></i>
                            </div>
                            <div class="property-content">
                                <div class="property-label">Button Text</div>
                                <input type="text" class="property-input" id="button-text" value="Call to Action">
                                <div class="property-label">Button URL</div>
                                <input type="url" class="property-input" id="button-url" placeholder="https://example.com">
                            </div>
                        </div>
                        
                        <div class="property-group">
                            <div class="property-header" onclick="togglePropertyGroup(this)">
                                <div class="property-header-title">
                                    <i class="fas fa-paint-brush"></i> Button Style
                                </div>
                                <i class="fas fa-chevron-down"></i>
                            </div>
                            <div class="property-content">
                                <div class="property-row">
                                    <div class="property-col">
                                        <div class="property-label">Background</div>
                                        <input type="color" class="property-input" id="button-bg" value="#667eea">
                                    </div>
                                    <div class="property-col">
                                        <div class="property-label">Text Color</div>
                                        <input type="color" class="property-input" id="button-color" value="#ffffff">
                                    </div>
                                </div>
                                <div class="property-row">
                                    <div class="property-col">
                                        <div class="property-label">Border Radius</div>
                                        <input type="range" class="property-input property-slider" id="button-radius" min="0" max="50" value="12">
                                        <div style="text-align: center; font-size: 12px; color: #6b7280; margin-top: 4px;">
                                            <span id="button-radius-value">12px</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>`;
                        
                default:
                    return `
                        <div class="property-group">
                            <div class="property-header">
                                <div class="property-header-title">
                                    <i class="fas fa-cog"></i> ${type.charAt(0).toUpperCase() + type.slice(1)} Properties
                                </div>
                            </div>
                            <div class="property-content">
                                <p style="text-align: center; color: #6b7280; padding: 20px;">
                                    Advanced properties for ${type} components will be available soon! 🚀
                                </p>
                            </div>
                        </div>`;
            }
        }

        function initializePropertyListeners(component, type) {
            // Text properties
            const fontSize = document.getElementById("font-size");
            const fontSizeValue = document.getElementById("font-size-value");
            const fontWeight = document.getElementById("font-weight");
            const lineHeight = document.getElementById("line-height");
            const textColor = document.getElementById("text-color");
            const bgColor = document.getElementById("bg-color");
            
            // Button properties
            const buttonText = document.getElementById("button-text");
            const buttonUrl = document.getElementById("button-url");
            const buttonBg = document.getElementById("button-bg");
            const buttonColor = document.getElementById("button-color");
            const buttonRadius = document.getElementById("button-radius");
            const buttonRadiusValue = document.getElementById("button-radius-value");

            if (fontSize && fontSizeValue) {
                fontSize.addEventListener("input", (e) => {
                    const textElement = component.querySelector("[contenteditable]");
                    if (textElement) {
                        textElement.style.fontSize = e.target.value + "px";
                        fontSizeValue.textContent = e.target.value + "px";
                        saveHistory();
                    }
                });
            }

            if (fontWeight) {
                fontWeight.addEventListener("change", (e) => {
                    const textElement = component.querySelector("[contenteditable]");
                    if (textElement) {
                        textElement.style.fontWeight = e.target.value;
                        saveHistory();
                    }
                });
            }

            if (buttonRadius && buttonRadiusValue) {
                buttonRadius.addEventListener("input", (e) => {
                    const buttonElement = component.querySelector(".legendary-email-button");
                    if (buttonElement) {
                        buttonElement.style.borderRadius = e.target.value + "px";
                        buttonRadiusValue.textContent = e.target.value + "px";
                        saveHistory();
                    }
                });
            }

            // Add more property listeners as needed...
        }

        function togglePropertyGroup(header) {
            const group = header.parentElement;
            const icon = header.querySelector(".fa-chevron-down, .fa-chevron-up");
            
            group.classList.toggle("collapsed");
            
            if (group.classList.contains("collapsed")) {
                icon.className = "fas fa-chevron-right";
            } else {
                icon.className = "fas fa-chevron-down";
            }
        }

        // 🗑️ COMPONENT ACTIONS
        function deleteComponent(componentId) {
            if (!confirm("Are you sure you want to delete this component?")) return;
            
            const component = document.querySelector(`[data-id="${componentId}"]`);
            if (component) {
                component.style.opacity = "0";
                component.style.transform = "scale(0.8)";
                
                setTimeout(() => {
                    component.remove();
                    checkEmptyState();
                    saveHistory();
                    updateArtboardHeight();
                    showNotification("Component deleted", "info");
                }, 200);
            }
        }

        function duplicateComponent(componentId) {
            const component = document.querySelector(`[data-id="${componentId}"]`);
            if (component) {
                componentCounter++;
                const newComponent = component.cloneNode(true);
                const type = component.getAttribute("data-type");
                const newId = `legendary-${type}-${componentCounter}`;
                newComponent.setAttribute("data-id", newId);
                
                // Update toolbar buttons
                const toolbar = newComponent.querySelector(".component-toolbar");
                toolbar.innerHTML = `
                    <button class="toolbar-action" onclick="duplicateComponent(\'${newId}\')" title="Duplicate">
                        <i class="fas fa-copy"></i>
                    </button>
                    <button class="toolbar-action" onclick="moveComponent(\'${newId}\', \'up\')" title="Move Up">
                        <i class="fas fa-arrow-up"></i>
                    </button>
                    <button class="toolbar-action" onclick="moveComponent(\'${newId}\', \'down\')" title="Move Down">
                        <i class="fas fa-arrow-down"></i>
                    </button>
                    <button class="toolbar-action danger" onclick="deleteComponent(\'${newId}\')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                `;
                
                // Setup events for new component
                setupComponentEvents(newComponent, newId);
                
                component.parentNode.insertBefore(newComponent, component.nextSibling);
                selectComponent(newId);
                saveHistory();
                updateArtboardHeight();
                showNotification("Component duplicated! ✨", "success");
            }
        }

        // 💾 HISTORY MANAGEMENT
        function saveHistory() {
            const emailCanvas = document.getElementById("email-canvas");
            emailHistory = emailHistory.slice(0, historyIndex + 1);
            emailHistory.push(emailCanvas.innerHTML);
            historyIndex++;
            
            // Limit history size
            if (emailHistory.length > 50) {
                emailHistory.shift();
                historyIndex--;
            }
        }

        function undoAction() {
            if (historyIndex > 0) {
                historyIndex--;
                const emailCanvas = document.getElementById("email-canvas");
                emailCanvas.innerHTML = emailHistory[historyIndex];
                checkEmptyState();
                updateArtboardHeight();
                showNotification("Undo successful", "info");
            }
        }

        function redoAction() {
            if (historyIndex < emailHistory.length - 1) {
                historyIndex++;
                const emailCanvas = document.getElementById("email-canvas");
                emailCanvas.innerHTML = emailHistory[historyIndex];
                checkEmptyState();
                updateArtboardHeight();
                showNotification("Redo successful", "info");
            }
        }

        function clearAll() {
            if (!confirm("Are you sure you want to clear all components? This action cannot be undone.")) return;
            
            const emailCanvas = document.getElementById("email-canvas");
            emailCanvas.innerHTML = `
                <div class="empty-artboard">
                    <div class="empty-icon"><i class="fas fa-rocket"></i></div>
                    <h3 class="empty-title">Ready to Create Something Legendary?</h3>
                    <p class="empty-subtitle">Drag components from the sidebar to start building your masterpiece email</p>
                </div>
            `;
            saveHistory();
            showNotification("Canvas cleared", "info");
        }

        function checkEmptyState() {
            const emailCanvas = document.getElementById("email-canvas");
            const hasComponents = emailCanvas.querySelector(".email-component");
            
            if (!hasComponents && !emailCanvas.querySelector(".empty-artboard")) {
                emailCanvas.innerHTML = `
                    <div class="empty-artboard">
                        <div class="empty-icon"><i class="fas fa-rocket"></i></div>
                        <h3 class="empty-title">Ready to Create Something Legendary?</h3>
                        <p class="empty-subtitle">Drag components from the sidebar to start building your masterpiece email</p>
                    </div>
                `;
            }
        }

        // 🚀 ADVANCED FEATURES
        function insertQuickVariable(variable) {
            const activeElement = document.activeElement;
            if (activeElement && activeElement.contentEditable === "true") {
                const selection = window.getSelection();
                if (selection.rangeCount > 0) {
                    const range = selection.getRangeAt(0);
                    range.deleteContents();
                    const span = document.createElement("span");
                    span.style.background = "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";
                    span.style.color = "white";
                    span.style.padding = "2px 6px";
                    span.style.borderRadius = "4px";
                    span.style.fontSize = "0.9em";
                    span.style.fontWeight = "600";
                    span.textContent = variable;
                    range.insertNode(span);
                    range.setStartAfter(span);
                    range.setEndAfter(span);
                    selection.removeAllRanges();
                    selection.addRange(range);
                    saveHistory();
                    showNotification(`Variable ${variable} inserted! ✨`, "success");
                }
            } else {
                showNotification("Click on a text area first to insert variables", "warning");
            }
        }

        function previewEmail() {
            const emailCanvas = document.getElementById("email-canvas");
            const emailSubject = document.getElementById("email-subject");
            
            // Create clean preview
            const tempCanvas = emailCanvas.cloneNode(true);
            tempCanvas.querySelectorAll(".component-toolbar").forEach(t => t.remove());
            tempCanvas.querySelectorAll(".email-component").forEach(c => {
                c.classList.remove("selected");
                c.removeAttribute("draggable");
                c.style.border = "none";
                c.style.background = "transparent";
            });
            
            const previewHTML = `<!DOCTYPE html>
<html>
<head>
    <title>${emailSubject.value}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
    <style>
        body { font-family: "Inter", -apple-system, BlinkMacSystemFont, sans-serif; margin: 0; padding: 20px; background: #f8fafc; }
        .email-wrapper { max-width: 650px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); }
        .email-header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 24px; text-align: center; }
        .email-body { padding: 32px; }
    </style>
</head>
<body>
    <div class="email-wrapper">
        <div class="email-header">
            <h1 style="margin: 0; font-size: 24px; font-weight: 700;">${emailSubject.value}</h1>
        </div>
        <div class="email-body">
            ${tempCanvas.innerHTML}
        </div>
    </div>
</body>
</html>`;
            
            const previewWindow = window.open("", "_blank", "width=700,height=900");
            previewWindow.document.write(previewHTML);
            previewWindow.document.close();
            
            showNotification("Preview opened! 👁️", "success");
        }

        function saveEmail() {
            const emailCanvas = document.getElementById("email-canvas");
            const emailSubject = document.getElementById("email-subject");
            
            // Clean up for saving
            const tempCanvas = emailCanvas.cloneNode(true);
            tempCanvas.querySelectorAll(".component-toolbar").forEach(t => t.remove());
            tempCanvas.querySelectorAll(".email-component").forEach(c => {
                c.classList.remove("selected");
                c.removeAttribute("draggable");
                c.removeAttribute("data-id");
                c.removeAttribute("data-type");
                c.style.border = "none";
                c.style.background = "transparent";
            });
            
            const saveData = {
                templateId: "' . htmlspecialchars($templateId) . '",
                html: tempCanvas.innerHTML,
                subject: emailSubject.value,
                mjml: JSON.stringify({
                    type: "legendary_editor",
                    version: "2.0",
                    components: Array.from(emailCanvas.querySelectorAll(".email-component")).map(c => ({
                        type: c.getAttribute("data-type"),
                        id: c.getAttribute("data-id"),
                        content: c.innerHTML
                    }))
                })
            };
            
            showNotification("Saving template... 💾", "info");
            
            // Get auth token from URL parameters
            const urlParams = new URLSearchParams(window.location.search);
            const authToken = urlParams.get("authToken");
            
            // Save directly to backend with proper authentication
            const headers = {
                "Content-Type": "application/json",
                "X-Requested-With": "XMLHttpRequest"
            };
            
            if (authToken) {
                headers["Authorization"] = "Bearer " + authToken;
            }
            
            fetch(window.location.origin + "/api/v1/EasyEmailEditor/action/saveTemplate", {
                method: "POST",
                headers: headers,
                body: JSON.stringify(saveData),
                credentials: "include"
            })
            .then(response => {
                console.log("Save response status:", response.status);
                
                if (!response.ok) {
                    return response.text().then(text => {
                        console.error("Non-OK response:", text);
                        throw new Error(`HTTP ${response.status}: ${text}`);
                    });
                }
                
                return response.text().then(text => {
                    console.log("Raw response text:", text);
                    try {
                        return JSON.parse(text);
                    } catch (e) {
                        console.error("JSON parse error:", e);
                        console.error("Response text that failed to parse:", text);
                        throw new Error("Invalid JSON response: " + text.substring(0, 100));
                    }
                });
            })
            .then(data => {
                console.log("Parsed response data:", data);
                
                if (data.success) {
                    showNotification("Template saved successfully! 🎉", "success");
                    
                    // Send message to parent window if it exists
                    if (window.opener) {
                        window.opener.postMessage({
                            type: "EASY_EMAIL_SAVE",
                            data: {
                                html: tempCanvas.innerHTML,
                                subject: emailSubject.value,
                                mjml: saveData.mjml,
                                templateId: data.id || saveData.templateId
                            }
                        }, "*");
                    }
                } else {
                    throw new Error(data.message || "Save failed");
                }
            })
            .catch(error => {
                console.error("Save error:", error);
                showNotification("Failed to save template: " + error.message, "error");
            });
        }

        function closeEditor() {
            if (confirm("Are you sure you want to close? Any unsaved changes will be lost.")) {
                if (window.parent !== window) {
                    window.parent.postMessage({ type: "EASY_EMAIL_CLOSE" }, "*");
                } else {
                    window.close();
                }
            }
        }
        
        function goBack() {
            if (confirm("Are you sure you want to go back? Any unsaved changes will be lost.")) {
                if (window.parent !== window) {
                    window.parent.postMessage({ type: "EASY_EMAIL_CLOSE" }, "*");
                } else {
                    // Try to go back in history, or close if that fails
                    if (window.history.length > 1) {
                        window.history.back();
                    } else {
                        window.close();
                    }
                }
            }
        }

        // 🔧 UTILITY FUNCTIONS
        function showNotification(message, type = "info") {
            const notification = document.createElement("div");
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 16px 20px;
                border-radius: 12px;
                color: white;
                font-weight: 600;
                font-size: 14px;
                z-index: 10000;
                animation: slideInRight 0.3s ease-out;
                box-shadow: 0 10px 25px rgba(0,0,0,0.2);
                backdrop-filter: blur(20px);
            `;
            
            const colors = {
                success: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                error: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                warning: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                info: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)"
            };
            
            notification.style.background = colors[type] || colors.info;
            notification.textContent = message;
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.style.animation = "slideOutRight 0.3s ease-in";
                setTimeout(() => notification.remove(), 300);
            }, 3000);
        }

        function setupKeyboardShortcuts() {
            document.addEventListener("keydown", (e) => {
                if (e.ctrlKey || e.metaKey) {
                    switch(e.key) {
                        case "z":
                            e.preventDefault();
                            if (e.shiftKey) {
                                redoAction();
                            } else {
                                undoAction();
                            }
                            break;
                        case "y":
                            e.preventDefault();
                            redoAction();
                            break;
                        case "s":
                            e.preventDefault();
                            saveEmail();
                            break;
                        case "d":
                            e.preventDefault();
                            if (selectedComponent) {
                                duplicateComponent(selectedComponent);
                            }
                            break;
                    }
                }
                
                if (e.key === "Delete" && selectedComponent) {
                    deleteComponent(selectedComponent);
                }
            });
        }

        function setupDragAndDrop() {
            const emailCanvas = document.getElementById("email-canvas");
            
            emailCanvas.addEventListener("dragover", (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
            });

            emailCanvas.addEventListener("drop", (e) => {
                e.preventDefault();
                if (isDragging && e.dataTransfer.getData("componentId")) {
                    const componentId = e.dataTransfer.getData("componentId");
                    const component = document.querySelector(`[data-id="${componentId}"]`);
                    if (component) {
                        const afterElement = getDragAfterElement(emailCanvas, e.clientY);
                        if (afterElement == null) {
                            emailCanvas.appendChild(component);
                        } else {
                            emailCanvas.insertBefore(component, afterElement);
                        }
                        saveHistory();
                    }
                }
            });
        }

        function getDragAfterElement(container, y) {
            const draggableElements = [...container.querySelectorAll(".email-component:not(.dragging)")];
            
            return draggableElements.reduce((closest, child) => {
                const box = child.getBoundingClientRect();
                const offset = y - box.top - box.height / 2;
                
                if (offset < 0 && offset > closest.offset) {
                    return { offset: offset, element: child };
                } else {
                    return closest;
                }
            }, { offset: Number.NEGATIVE_INFINITY }).element;
        }

        function setViewMode(mode) {
            const artboard = document.getElementById("email-artboard");
            const buttons = document.querySelectorAll(".view-btn");
            
            buttons.forEach(btn => btn.classList.remove("active"));
            event.target.classList.add("active");
            
            if (mode === "mobile") {
                artboard.style.maxWidth = "375px";
                artboard.style.transition = "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)";
            } else {
                artboard.style.maxWidth = "650px";
                artboard.style.transition = "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)";
            }
        }

        function notifyParentReady() {
            if (window.parent !== window) {
                window.parent.postMessage({
                    type: "EASY_EMAIL_READY",
                    config: {
                        templateId: "' . htmlspecialchars($templateId) . '",
                        timestamp: "' . $timestamp . '",
                        version: "2.0-legendary",
                        features: ["drag-drop", "properties", "templates", "variables", "preview"]
                    }
                }, "*");
            }
            
            console.log("🚀 Legendary Email Editor Ready!");
            showNotification("🚀 Legendary Email Editor Loaded!", "success");
        }

        // Add CSS animations
        const style = document.createElement("style");
        style.textContent = `
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOutRight {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);

        // Placeholder functions for template and variable features
        function loadTemplate() {
            showNotification("Template loader coming soon! 📄", "info");
        }

        function insertVariable() {
            showNotification("Variable browser coming soon! 🔧", "info");
        }

        function moveComponent(componentId, direction) {
            const component = document.querySelector(`[data-id="${componentId}"]`);
            if (component) {
                if (direction === "up" && component.previousElementSibling) {
                    component.parentNode.insertBefore(component, component.previousElementSibling);
                } else if (direction === "down" && component.nextElementSibling) {
                    component.parentNode.insertBefore(component.nextElementSibling, component);
                }
                saveHistory();
                showNotification(`Component moved ${direction}`, "success");
            }
        }

        function selectImage(componentId) {
            const imageUrl = prompt("Enter image URL:");
            if (imageUrl) {
                const component = document.querySelector(`[data-id="${componentId}"]`);
                if (component) {
                    const imageContainer = component.querySelector(".image-component");
                    imageContainer.innerHTML = `<img src="${imageUrl}" alt="Email Image" style="max-width: 100%; height: auto; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">`;
                    saveHistory();
                    showNotification("Image added! 🖼️", "success");
                }
            }
        }
        
        function toggleProperties() {
            const panel = document.getElementById("properties-panel");
            const button = event.target.closest(".legendary-btn");
            
            if (panel.classList.contains("active")) {
                panel.classList.remove("active");
                button.innerHTML = \'<i class="fas fa-cog"></i> Properties\';
                showNotification("Properties panel hidden", "info");
            } else {
                panel.classList.add("active");
                button.innerHTML = \'<i class="fas fa-times"></i> Hide\';
                showNotification("Properties panel shown", "info");
                
                // If no component is selected, show helper
                if (!selectedComponent) {
                    document.getElementById("properties-content").innerHTML = `
                        <div style="text-align: center; padding: 40px 20px; color: #6b7280;">
                            <i class="fas fa-mouse-pointer" style="font-size: 48px; margin-bottom: 16px; opacity: 0.3;"></i>
                            <p>Select a component to edit its properties</p>
                        </div>
                    `;
                }
            }
        }';
    }
}