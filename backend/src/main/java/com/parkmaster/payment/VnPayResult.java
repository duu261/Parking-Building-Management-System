package com.parkmaster.payment;

/** Outcome of processing a VNPay return/callback, mapped to a redirect status. */
public enum VnPayResult {
    SUCCESS,
    FAILED,
    INVALID_SIGNATURE,
    NOT_FOUND,
    AMOUNT_MISMATCH
}
