import React from 'react';
import { Modal, Button } from 'react-bootstrap';

const NotificationPermissionPopup = ({ onEnable, onCancel }) => {
    return (
        <Modal show={true} centered backdrop="static" keyboard={false}>
            <Modal.Body className="text-center p-4">
                <div className="mb-3">
                    <span style={{ fontSize: '3rem' }}>🔔</span>
                </div>
                <h5 className="mb-3 fw-bold">Enable Notifications</h5>
                <p className="text-muted mb-4">
                    Stay updated with the latest activities, profile changes, and security alerts.
                </p>
                <div className="d-flex flex-column gap-2">
                    <Button
                        variant="primary"
                        onClick={onEnable}
                        className="fw-bold py-2 rounded-0"
                        style={{ backgroundColor: '#0d6efd' }}
                    >
                        Enable Notifications
                    </Button>
                    <Button
                        variant="light"
                        onClick={onCancel}
                        className="text-muted py-2 rounded-0 border-0"
                    >
                        Cancel
                    </Button>
                </div>
            </Modal.Body>
        </Modal>
    );
};

export default NotificationPermissionPopup;
