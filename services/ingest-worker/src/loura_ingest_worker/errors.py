from __future__ import annotations


class IngestionError(Exception):
    code = "INGESTION_FAILED"
    retryable = False
    public_message = "The source could not be processed."


class TransientIngestionError(IngestionError):
    code = "TRANSIENT_INGESTION_FAILURE"
    retryable = True
    public_message = "Source processing was interrupted and can be retried."


class UnsupportedSourceError(IngestionError):
    code = "UNSUPPORTED_SOURCE_TYPE"
    public_message = "The source format is not supported."


class SourceTooLargeError(IngestionError):
    code = "SOURCE_TOO_LARGE"
    public_message = "The source exceeds the configured size limit."


class ChecksumMismatchError(IngestionError):
    code = "CHECKSUM_MISMATCH"
    public_message = "The stored source did not match its recorded checksum."


class DuplicateSourceError(IngestionError):
    code = "DUPLICATE_SOURCE"
    public_message = "The source duplicates an existing workspace source."


class UnsafeUrlError(IngestionError):
    code = "UNSAFE_SOURCE_URL"
    public_message = "The submitted URL is not permitted by the source safety policy."


def sanitized_error(error: Exception) -> tuple[str, str, bool]:
    if isinstance(error, IngestionError):
        return error.code, error.public_message, error.retryable
    return "INGESTION_FAILED", "The source could not be processed.", False
