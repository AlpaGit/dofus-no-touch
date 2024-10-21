import IsoEngine from "./IsoEngine";
import Background from "../Common/Background";
import Foreground from "../Common/Foreground";
import Gui from "./Gui/Gui.ts";

export default class Engine{
    public static isoEngine: IsoEngine;
    public static background: Background;
    public static foreground: Foreground;
    public static gui: Gui;
}