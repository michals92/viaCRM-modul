import {useEffect, useMemo, useRef, useState} from 'react';
import {AdvancedType, BasicType, BlockManager, JsonToMjml} from 'easy-email-core';
import {MjmlToJson} from 'easy-email-extensions';
import {StandardLayout} from 'easy-email-extensions';
import {EmailEditor, EmailEditorProvider, Stack} from 'easy-email-editor';
import {Button, PageHeader} from '@arco-design/web-react';
import {IconMoonFill, IconSunFill} from '@arco-design/web-react/icon';
import useExportTemplate from './hooks/useExportTemplate';
import useImportTemplate from './hooks/useImportTemplate';
import locales from 'easy-email-localization/locales/locales.json';

import 'easy-email-editor/lib/style.css';
import 'easy-email-extensions/lib/style.css';
import '@arco-themes/react-easy-email-theme/css/arco.css';
import './css/styles.css';
import {useFullScreenHandle} from "./hooks/useFullScreenHandle";

const categories = [
    {
        label: 'Content',
        active: true,
        blocks: [
            {
                type: AdvancedType.TEXT,
            },
            {
                type: AdvancedType.IMAGE,
                payload: {attributes: {padding: '0px 0px 0px 0px'}},
            },
            {
                type: AdvancedType.BUTTON,
            },
            {
                type: AdvancedType.SOCIAL,
            },
            {
                type: AdvancedType.DIVIDER,
            },
            {
                type: AdvancedType.SPACER,
            },
            {
                type: AdvancedType.HERO,
            },
            {
                type: AdvancedType.ACCORDION,
            },
            {
                type: AdvancedType.CAROUSEL,
            },
            {
                type: AdvancedType.WRAPPER,
            },
        ],
    },
    {
        label: 'Layout',
        active: true,
        displayType: 'column',
        blocks: [
            {
                title: '2 columns',
                payload: [
                    ['50%', '50%'],
                    ['33%', '67%'],
                    ['67%', '33%'],
                    ['25%', '75%'],
                    ['75%', '25%'],
                ],
            },
            {
                title: '3 columns',
                payload: [
                    ['33.33%', '33.33%', '33.33%'],
                    ['25%', '25%', '50%'],
                    ['50%', '25%', '25%'],
                ],
            },
            {
                title: '4 columns',
                payload: [
                    ['25%', '25%', '25%', '25%']
                ],
            },
        ],
    },
];

export default function Editor({
                                   mjmlContent,
                                   content,
                                   height,
                                   onChange,
                                   onUploadImage,
                                   locale,
                                   translations,
                                   onToggleFullscreen
                               }) {
    height = height || 'calc(100vh - 85px)';
    locale = locale || 'en';
    translations = translations || {};
    const easyEmailLocale = locale in locales ? locales[locale] : locales['en'];
    const language = {...easyEmailLocale, ...translations};

    let defaultTemplate = content;

    if (!defaultTemplate && mjmlContent) {
        defaultTemplate = MjmlToJson(mjmlContent);
    }

    if (!defaultTemplate) {
        defaultTemplate = BlockManager.getBlockByType(BasicType.PAGE).create({});
    }

    const translate = key => {
        return key in language ? language[key] : key;
    };

    const wrapperEl = useRef(null);
    const [template, setTemplate] = useState(defaultTemplate);
    const [exportFileName, setExportFileName] = useState('export.mjml');
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [smallScene, setSmallScene] = useState(false);
    const [editorHeight, setEditorHeight] = useState(height);

    const fullScreenHandle = useFullScreenHandle();
    const {exportTemplate} = useExportTemplate();
    const {importTemplate} = useImportTemplate();

    const initialValues = useMemo(() => {
        return {
            content: template,
        };
    }, [template]);

    useEffect(() => {
        if (onToggleFullscreen) {
            onToggleFullscreen(fullScreenHandle.active);
        }

        setEditorHeight(fullScreenHandle.active ? '100vh' : height);
    }, [fullScreenHandle.active]);

    useEffect(() => {
        if (content) {
            setTemplate(content);
        } else if (mjmlContent) {
            setTemplate(MjmlToJson(mjmlContent));
        }
    }, [content, mjmlContent]);

    useEffect(() => {
        function handleResize() {
            if (wrapperEl.current) {
                setSmallScene(wrapperEl.current.offsetWidth < 1400);
            }
        }

        window.addEventListener("resize", handleResize);
        handleResize();
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    useEffect(() => {
        if (isDarkMode) {
            document.body.setAttribute('arco-theme', 'dark');
        } else {
            document.body.removeAttribute('arco-theme');
        }

        return () => document.body.removeAttribute('arco-theme');
    }, [isDarkMode]);

    const onExportMjml = (values) => {
        exportTemplate(exportFileName, JsonToMjml({
            data: values.content,
            mode: 'production',
            context: values.content,
        }));
    };

    const onImportMjml = async () => {
        const [fileName, template] = await importTemplate();
        setExportFileName(fileName);
        setTemplate(template);
    };

    return (
        <div
            ref={wrapperEl}
            className={'easy-email-editor-wrapper'}
            data-fullscreen={fullScreenHandle.active}
        >
            <EmailEditorProvider
                data={initialValues}
                height={editorHeight}
                onUploadImage={onUploadImage || undefined}
                locale={language}
            >
                {({values}) => {
                    if (onChange) {
                        onChange(values);
                    }

                    return (
                        <>
                            <PageHeader
                                title={translate('Edit')}
                                style={{background: 'var(--color-bg-2)'}}
                                extra={
                                    <Stack alignment={'center'}>
                                        <Button
                                            onClick={() => setIsDarkMode(v => !v)}
                                            shape='circle'
                                            type='text'
                                            icon={isDarkMode ? <IconMoonFill/> : <IconSunFill/>}
                                        ></Button>
                                        <Button onClick={fullScreenHandle.toggle}>
                                            {fullScreenHandle.active ? translate('Exit Full Screen') : translate('Full Screen')}
                                        </Button>
                                        <Button onClick={() => onExportMjml(values)}>
                                            {translate('Export Template')}
                                        </Button>
                                        <Button onClick={onImportMjml}>
                                            {translate('Import Template')}
                                        </Button>
                                    </Stack>
                                }
                            />
                            <StandardLayout
                                showSourceCode={true}
                                categories={categories}
                                compact={!smallScene}
                            >
                                <EmailEditor/>
                            </StandardLayout>
                        </>
                    );
                }}
            </EmailEditorProvider>
        </div>
    );
};
