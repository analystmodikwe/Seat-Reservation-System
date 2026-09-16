// seat reservation rules to hold  seats, expiry time, Maximum concurrent holds per user, Maximum holds per user per hour,Maximum extensions per hold

export const RESERVE_CONFIG = {
    SEATS_PER_EVENT : 20,

    HOLD_CODE_LENGTH : 6,

    HOLD_EXPIRY_TIME: Number(process.env.HOLD_EXPIRY_TIME_SECONDS ?? 60),

    MAXIMUM_CONCURRENT_HOLDS_PER_USER: 2,

    MAXIMUM_HOLDS_PER_USER_PER_HOUR: (process.env.MAXIMUM_HOLDS_PER_USER_PER_HOUR ?? 5),

    MAXIMUM_EXTENSIONS_PER_HOLD: 2



}
