declare module 'react-map-interaction' {
    import { FC, ReactNode, PropsWithChildren } from 'react';

    export type Translation = {
        x: number;
        y: number;
    };

    export type ScaleTranslation = {
        scale: number;
        translation: Translation;
    };

    export type MapInteractionProps = {
        children?: (scaleTranslation: ScaleTranslation) => ReactNode;

        value?: ScaleTranslation;

        defaultValue?: ScaleTranslation;

        disableZoom?: boolean;

        disablePan?: boolean;

        translationBounds?: {
            xMin?: number;
            xMax?: number;
            yMin?: number;
            yMax?: number;
        };

        onChange?: (scaleTranslation: ScaleTranslation) => void;

        minScale?: number;
        maxScale?: number;

        showControls?: boolean;

        plusBtnContents?: ReactNode;
        minusBtnContents?: ReactNode;

        controlsClass?: string;

        btnClass?: string;

        plusBtnClass?: string;
        minusBtnClass?: string;
    };

    export const MapInteraction: FC<MapInteractionProps>;

    export type MapInteractionCSSProps = PropsWithChildren<Omit<MapInteractionProps, 'children'>> & {
        className?: string;
    };

    export const MapInteractionCSS: FC<MapInteractionCSSProps>;

    export default MapInteraction;
}
