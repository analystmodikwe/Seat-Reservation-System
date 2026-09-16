
export interface CodeRecord {
    code:string;
    createdAt: number;
    firstRecievedAt: number;
    expiresAt: number;

}

export interface CodeHistory {
    code: string;
    createdAt: number;
}

export interface GetCode {
    code: string;
    isResend: boolean;
}

export interface VerifyCode {
    valid: boolean;
    reason?: string
}

