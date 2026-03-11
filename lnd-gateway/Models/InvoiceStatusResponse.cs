namespace lnd_gateway.Models;

public record InvoiceStatusResponse(
    string RHash,
    string State,        // "OPEN" | "SETTLED" | "CANCELED" | "ACCEPTED"
    bool Settled,
    long AmountSats,
    long AmountPaidSats,
    string Memo
);
