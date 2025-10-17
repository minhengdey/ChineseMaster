import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, info) {
        // eslint-disable-next-line no-console
        console.error('ErrorBoundary caught error:', error, info);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="p-6 bg-error/10 rounded">
                    <h3 className="font-semibold mb-2">Đã xảy ra lỗi</h3>
                    <div className="text-sm text-base-content/70 mb-4">
                        Có lỗi xảy ra khi hiển thị phần này. Vui lòng thử tải lại trang.
                    </div>
                    <div className="flex gap-2">
                        <button className="btn btn-sm btn-ghost" onClick={() => window.location.reload()}>
                            Tải lại
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
