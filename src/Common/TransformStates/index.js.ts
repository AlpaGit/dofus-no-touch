export class TransformState{
    public sx: number;
    public sy: number;

    public r: number;
    public g: number;
    public b: number;
    public a: number;

    constructor(sx: number, sy: number, r: number, g: number, b: number, a: number){
        this.sx = sx;
        this.sy = sy;
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }
}

export default class TransformStates{
    public static empty = new TransformState(0.10, 0.10, 0.50, 0.50, 0.50, 0.00); // Has to have alpha = 0

    // used by spriteBoxes
    public static fullRed   = new TransformState(0.78, 0.78, 0.80, 0.12, 0.08, 0.80);
    public static fullGreen = new TransformState(0.78, 0.78, 0.00, 1.00, 0.22, 0.70);
    public static fullBlue  = new TransformState(0.78, 0.78, 0.00, 0.51, 0.91, 0.80);

    public static walkable     = new TransformState(0.90, 0.90, 1.00, 0.92, 0.00, 0.50);
    public static unwalkable   = new TransformState(0.90, 0.90, 0.90, 0.00, 0.00, 0.80);
    public static walkableLast = new TransformState(0.90, 0.90, 1.00, 1.00, 0.00, 0.80);

    // spell related
    public static inSight      = new TransformState(0.78, 0.78, 0.00, 0.00, 1.00, 0.50);
    public static outSight     = new TransformState(0.78, 0.78, 0.60, 0.60, 1.00, 0.50);
    public static areaOfEffect = new TransformState(0.78, 0.78, 1.00, 0.00, 0.00, 0.90);

    // spell related, not users turn
    public static inSightEnemyTurn      = new TransformState(0.78, 0.78, 0.30, 0.30, 0.30, 0.80);
    public static outSightEnemyTurn     = new TransformState(0.78, 0.78, 0.50, 0.50, 0.50, 0.70);
    public static areaOfEffectEnemyTurn = new TransformState(0.78, 0.78, 1.00, 1.00, 1.00, 1.00);

    // used by targetIndicators
    public static blueTeamStart = new TransformState(1.00, 1.00, 0.00, 0.00, 1.00, 0.50);
    public static blueTeamEnd   = new TransformState(0.95, 1.00, 0.10, 0.40, 0.80, 0.45);
    public static redTeamStart  = new TransformState(1.00, 1.00, 1.00, 0.00, 0.00, 0.50);
    public static redTeamEnd    = new TransformState(0.95, 1.00, 0.80, 0.40, 0.10, 0.45);

    // used by walkable area
    public static walkArea           = new TransformState(1.00, 1.00, 0.00, 0.90, 0.02, 0.30);
    public static walkAreaRequiresAP = new TransformState(1.00, 1.00, 0.00, 0.43, 0.40, 0.40);
    public static walkAreaRestricted = new TransformState(1.00, 1.00, 1.00, 0.00, 0.00, 0.40);

    public static enemyWalkArea           = new TransformState(1.000, 1.000, 0.100, 0.900, 0.032, 0.600);
    public static enemyWalkAreaRequiresAP = new TransformState(1.000, 1.000, 0.100, 0.435, 0.400, 0.600);
    public static enemyWalkAreaRestricted = new TransformState(0.900, 0.900, 1.000, 0.000, 0.000, 0.600);
}