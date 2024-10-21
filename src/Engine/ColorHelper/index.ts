export default class ColorHelper{
    public static toHexaString(n: number, format: number): string {
        let s = n.toString(16).toUpperCase();
        if (format) {
            while (s.length < format) {
                s = '0' + s;
            }
        }
        return s;
    }

    public static colorArrayToHexa(c: number[]) {
        let red   = ColorHelper.toHexaString(c[0], 2);
        let green = ColorHelper.toHexaString(c[1], 2);
        let blue  = ColorHelper.toHexaString(c[2], 2);
        return '#' + red + green + blue;
    }

    public static hexaToColorArray(color: string) {
        color = color.substring(1);
        if (color.length === 3) {
            return [
                parseInt(color[0] + color[0], 16) / 255.0,
                parseInt(color[1] + color[1], 16) / 255.0,
                parseInt(color[2] + color[2], 16) / 255.0,
                1
            ];
        } else {
            return [
                parseInt(color.substring(0, 2), 16) / 255.0,
                parseInt(color.substring(2, 2), 16) / 255.0,
                parseInt(color.substring(4, 2), 16) / 255.0,
                1
            ];
        }
    }

    public static rgbaToColorArray(colorString: string) {
        // Parse color from rgba(255, 255, 255, 1) style string
        let index0 = colorString.indexOf('(');
        let index1 = colorString.indexOf(',');
        let index2 = colorString.indexOf(',', index1 + 1);
        let index3 = colorString.indexOf(',', index2 + 1);
        let index4 = colorString.indexOf(')', index3 + 1);

        return [
            parseInt(colorString.substring(index0 + 1, index1), 10) / 255.0,
            parseInt(colorString.substring(index1 + 1, index2), 10) / 255.0,
            parseInt(colorString.substring(index2 + 1, index3), 10) / 255.0,
            parseFloat(colorString.substring(index3 + 1, index4))
        ];
    }

    public static parseIndexedColor(indexedColor: number){
        let index = (indexedColor & 0xF000000) >> 24;
        let red   = (indexedColor & 0xFF0000) >> 16;
        let green = (indexedColor & 0x00FF00) >> 8;
        let blue  = (indexedColor & 0x0000FF);
        return { index: index, color: { r: red, g: green, b: blue } };
    }

    public static addIndex(color: number, index: number) {
        return color + (index << 24);
    }

    public static addIndexes(colors: number[]) {
        let indexed = [];
        for (let i = 0; i < colors.length; i++) {
            indexed.push(ColorHelper.addIndex(colors[i], i + 1));
        }
        return indexed;
    }

   public static anyToColorArray(color: string | number[]) : number[] {
       if (typeof color === 'string') {
           if (color.indexOf('#') === 0) {
               return ColorHelper.hexaToColorArray(color);
           }

           if (color.indexOf('rgba(') === 0) {
               return ColorHelper.rgbaToColorArray(color);
           }
       }

       return color as number[];
   }

    /**
     * @param {Number[]} indexedColors - indexed color array as sent by server within `EntityLook` data
     */
    public static parseIndexedColors(indexedColors: number[]) {
        let tints: ({ r: number, g: number, b: number } | null)[] = [];
        if (indexedColors && indexedColors.length > 0) {
            tints = [null, null, null, null, null, null];
            for (let i = 0; i < indexedColors.length; i++) {
                let indexedColor = ColorHelper.parseIndexedColor(indexedColors[i]);
                tints[indexedColor.index] = indexedColor.color;
            }
        }
        return tints;
    }

    public static getIndexedColor(index: number, red: number, green: number, blue: number) {
        let result = 0;
        result |= (index & 0xF)  << 24;
        result |= (red   & 0xFF) << 16;
        result |= (green & 0xFF) << 8;
        result |= (blue  & 0xFF);
        return result;
    }

    /**
     * Transform hex to rgb colors
     * @param {string} hex - the hexa color can be 'FFF' or 'FFFFFF'
     * @return {object|null} - object with rgb values or null
     */
    public static hexToRgb(hex: string) {
        let rgb = parseInt(hex, 16);
        if (hex.length === 6) {
            return {
                r: (rgb & 0xff0000) >> 16,
                g: (rgb & 0x00ff00) >> 8,
                b: (rgb & 0x0000ff)
            };
        }

        if (hex.length === 3) {
            // Short hand format
            let r0 = (rgb & 0xf00) >> 8;
            let g0 = (rgb & 0x0f0) >> 4;
            let b0 = (rgb & 0x00f);
            return {
                r: r0 + (r0 << 4),
                g: g0 + (g0 << 4),
                b: b0 + (b0 << 4)
            };
        }

        console.warn('[hexToRgb] Invalid hex value');
        return null;
    }

}