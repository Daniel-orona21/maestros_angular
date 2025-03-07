declare module 'html2pdf.js' {
    interface Options {
        margin?: number;
        filename?: string;
        image?: {
            type?: string;
            quality?: number;
        };
        html2canvas?: {
            scale?: number;
            useCORS?: boolean;
            logging?: boolean;
            letterRendering?: boolean;
        };
        jsPDF?: {
            unit?: string;
            format?: string;
            orientation?: string;
        };
    }

    interface Html2Pdf {
        set(options: Options): Html2Pdf;
        from(element: HTMLElement): Html2Pdf;
        save(): Promise<void>;
    }

    function html2pdf(): Html2Pdf;
    export = html2pdf;
} 