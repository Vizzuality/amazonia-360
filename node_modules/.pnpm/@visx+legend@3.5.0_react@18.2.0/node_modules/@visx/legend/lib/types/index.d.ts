import { AnyD3Scale, ScaleInput } from '@visx/scale';
import { ComponentClass, CSSProperties, FC } from 'react';
export declare type LabelFormatterFactory<Scale extends AnyD3Scale> = (args: {
    scale: Scale;
    labelFormat: LabelFormatter<ScaleInput<Scale>>;
}) => ItemTransformer<ScaleInput<Scale>, ReturnType<Scale>>;
export declare type LabelFormatter<Datum> = (item: Datum, itemIndex: number) => Datum | string | number | undefined;
export declare type FormattedLabel<Datum, Output, ExtraAttributes = {}> = {
    datum: Datum;
    index: number;
    text: string;
    value?: Output;
} & ExtraAttributes;
export declare type ItemTransformer<Datum, Output> = (item: Datum, itemIndex: number) => FormattedLabel<Datum, Output>;
export declare type RenderShapeProvidedProps<Data, Output> = {
    width?: string | number;
    height?: string | number;
    label: FormattedLabel<Data, Output>;
    item: Data;
    itemIndex: number;
    fill?: string;
    size?: string | number;
    style?: CSSProperties;
};
export declare type LegendShape<Data, Output> = 'rect' | 'circle' | 'line' | FC<RenderShapeProvidedProps<Data, Output>> | ComponentClass<RenderShapeProvidedProps<Data, Output>>;
export declare type FillAccessor<Datum, Output> = (label: FormattedLabel<Datum, Output>) => string | undefined;
export declare type SizeAccessor<Datum, Output> = (label: FormattedLabel<Datum, Output>) => string | number | undefined;
export declare type ShapeStyleAccessor<Datum, Output> = (label: FormattedLabel<Datum, Output>) => CSSProperties | undefined;
export declare type FlexDirection = 'inherit' | 'initial' | 'revert' | 'unset' | 'column' | 'column-reverse' | 'row' | 'row-reverse';
//# sourceMappingURL=index.d.ts.map