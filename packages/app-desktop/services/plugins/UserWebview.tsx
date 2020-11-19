import * as React from 'react';
import { useRef, useImperativeHandle, forwardRef } from 'react';
import useViewIsReady from './hooks/useViewIsReady';
import useThemeCss from './hooks/useThemeCss';
import useContentSize from './hooks/useContentSize';
import useSubmitHandler from './hooks/useSubmitHandler';
import useHtmlLoader from './hooks/useHtmlLoader';
import useWebviewToPluginMessages from './hooks/useWebviewToPluginMessages';
import useScriptLoader from './hooks/useScriptLoader';
const styled = require('styled-components').default;

export interface Props {
	html: string;
	scripts: string[];
	onMessage: Function;
	pluginId: string;
	viewId: string;
	themeId: number;
	minWidth?: number;
	minHeight?: number;
	fitToContent?: boolean;
	borderBottom?: boolean;
	theme?: any;
	onSubmit?: any;
	onDismiss?: any;
}

const StyledFrame = styled.iframe`
	padding: 0;
	margin: 0;
	width: ${(props: any) => props.fitToContent ? `${props.width}px` : '100%'};
	height: ${(props: any) => props.fitToContent ? `${props.height}px` : '100%'};
	border: none;
	border-bottom: ${(props: Props) => props.borderBottom ? `1px solid ${props.theme.dividerColor}` : 'none'};
`;

function serializeForm(form: any) {
	const output: any = {};
	const formData = new FormData(form);
	for (const key of formData.keys()) {
		output[key] = formData.get(key);
	}
	return output;
}

function serializeForms(document: any) {
	const forms = document.getElementsByTagName('form');
	const output: any = {};
	let untitledIndex = 0;

	for (const form of forms) {
		const name = `${form.getAttribute('name')}` || (`form${untitledIndex++}`);
		output[name] = serializeForm(form);
	}

	return output;
}

function UserWebview(props: Props, ref: any) {
	const minWidth = props.minWidth ? props.minWidth : 200;
	const minHeight = props.minHeight ? props.minHeight : 20;

	const viewRef = useRef(null);
	const isReady = useViewIsReady(viewRef);
	const cssFilePath = useThemeCss({ pluginId: props.pluginId, themeId: props.themeId });

	function frameWindow() {
		if (!viewRef.current) return null;
		return viewRef.current.contentWindow;
	}

	function postMessage(name: string, args: any = null) {
		const win = frameWindow();
		if (!win) return;
		win.postMessage({ target: 'webview', name, args }, '*');
	}

	useImperativeHandle(ref, () => {
		return {
			formData: function() {
				if (viewRef.current) {
					return serializeForms(frameWindow().document);
				} else {
					return null;
				}
			},
		};
	});

	const htmlHash = useHtmlLoader(
		frameWindow(),
		isReady,
		postMessage,
		props.html
	);

	const contentSize = useContentSize(
		frameWindow(),
		htmlHash,
		minWidth,
		minHeight,
		props.fitToContent,
		isReady
	);

	useSubmitHandler(
		frameWindow(),
		props.onSubmit,
		props.onDismiss,
		htmlHash
	);

	useWebviewToPluginMessages(
		frameWindow(),
		props.onMessage,
		props.pluginId,
		props.viewId
	);

	useScriptLoader(
		postMessage,
		isReady,
		props.scripts,
		cssFilePath
	);

	return <StyledFrame
		id={props.viewId}
		width={contentSize.width}
		height={contentSize.height}
		fitToContent={props.fitToContent}
		ref={viewRef}
		src="services/plugins/UserWebviewIndex.html"
		borderBottom={props.borderBottom}
	></StyledFrame>;
}

export default forwardRef(UserWebview);