-- Monthly pass pricing + payment link
ALTER TABLE pricing_policy
    ADD COLUMN monthly_pass_price NUMERIC(10, 0);

ALTER TABLE monthly_pass
    ADD COLUMN payment_id BIGINT REFERENCES payment(id);

-- Payment.session becomes nullable (pass payments have no session)
ALTER TABLE payment
    ALTER COLUMN session_id DROP NOT NULL;
