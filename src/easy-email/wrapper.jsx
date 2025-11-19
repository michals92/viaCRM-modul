import React from 'react';
import ReactDOM from 'react-dom';
import Editor from './Editor'
import {JsonToMjml} from 'easy-email-core';
import mjml2html from 'mjml-browser';

class EditorHolder {
    constructor(element, props) {
        this.element = element;
        this.props = props || {};
        this.content = {};
        this.onChange = props.onChange || Function.prototype;
        this.props.onChange = (values) => {
            this.content = values.content;
            this.onChange(values.content);
        };
    }

    render() {
        ReactDOM.render(
            <Editor {...this.props} />,
            this.element,
        );
    }

    setContent(content) {
        this.props.content = content;
        this.render();
    }

    setMjml(mjml) {
        this.props.mjmlContent = mjml;
        this.render();
    }

    unmount() {
        ReactDOM.unmountComponentAtNode(this.element);
    }

    getContent() {
        return this.content;
    }

    getMjml() {
        return JsonToMjml({
            data: this.getContent(),
            mode: 'production',
            context: this.getContent(),
        });
    }

    getHtml() {
        return mjml2html(this.getMjml(), {
            beautify: false,
            validationLevel: 'soft',
        }).html;
    }
}

export function render(element, props) {
    const editor = new EditorHolder(element, props);
    editor.render();
    return editor;
};
