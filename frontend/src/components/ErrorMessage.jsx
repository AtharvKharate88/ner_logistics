import "./ErrorMessage.css";

function ErrorMessage({
    message = "Unable to connect to the risk prediction service.",
    onRetry,
}) {
    return (
        <div className="error-message" role="alert">
            <div className="error-message__icon" aria-hidden="true">
                !
            </div>

            <div className="error-message__content">
                <p className="error-message__text">{message}</p>

                {onRetry && (
                    <button
                        type="button"
                        className="error-message__retry"
                        onClick={onRetry}
                    >
                        Retry
                    </button>
                )}
            </div>
        </div>
    );
}

export default ErrorMessage;