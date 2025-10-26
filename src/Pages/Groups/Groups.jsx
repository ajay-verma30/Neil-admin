import React, { useEffect, useState, useContext, useCallback } from 'react';
import { Row, Col, Table, Spinner, Alert, Button, Modal, Form } from 'react-bootstrap';
import TopBar from '../../Components/TopBar/TopBar';
import Sidebar from '../../Components/SideBar/SideBar';
import { AuthContext } from '../../context/AuthContext';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus
} from "@fortawesome/free-solid-svg-icons";
import axios from 'axios';

function Groups() {
  const { accessToken } = useContext(AuthContext);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [showAddGroupModal, setShowAddGroupModal] = useState(false);
  const [newGroupTitle, setNewGroupTitle] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const fetchGroups = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:3000/groups/all');
      setGroups(res.data.groups || []);
      if (alert && alert.type === 'success') setAlert(null); 
    } catch (error) {
      setAlert({ type: 'danger', message: error.response?.data?.message || 'Failed to fetch groups.' });
    } finally {
      setLoading(false);
    }
  }, [alert]);


  useEffect(() => {
    if (accessToken) fetchGroups();
  }, [accessToken, fetchGroups]); 
  const handleShowModal = () => {
    setShowAddGroupModal(true);
    setNewGroupTitle(''); 
    setAlert(null); 
  }
  const handleCloseModal = () => setShowAddGroupModal(false);

  const handleAddGroupChange = (e) => {
    setNewGroupTitle(e.target.value);
  }

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    const title = newGroupTitle.trim();

    if (!title) {
        setAlert({ type: 'warning', message: 'Group Title cannot be empty.' });
        return;
    }

    setSubmitting(true);
    setAlert(null);

    try {
        const payload = { title };
        const res = await axios.post('http://localhost:3000/groups/new', payload);
        handleCloseModal();
        setAlert({ type: 'success', message: `Group "${title}" created successfully!` });
        await fetchGroups();

    } catch (error) {
        console.error('Error creating group:', error.response?.data?.message || error.message);
        setAlert({ type: 'warning', message: error.response?.data?.message || 'An unexpected error occurred during creation.' }); 
    } finally {
        setSubmitting(false);
    }
  };


  return (
    <>
      <TopBar />
      <Row>
        <Col xs={2} md={2}>
          <Sidebar />
        </Col>
        <Col xs={10} md={10}>

          <div className=" form-box  p-3">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className="mb-0">Groups List</h4>
                <div className="d-flex gap-2">
                      <Button
                    variant="primary"
                    size="sm"
                    onClick={handleShowModal} 
                >
                    <FontAwesomeIcon icon={faPlus} className="me-2" />
                    Add Group
                </Button>      
                </div>
            </div>
 

            {alert && alert.type !== 'warning' && (
              <Alert
                variant={alert.type}
                onClose={() => setAlert(null)}
                dismissible
                className="mb-3"
              >
                {alert.message}
              </Alert>
            )}

            {loading ? (
              <div className="text-center p-5">
                <Spinner animation="border" variant="primary" />
                <p className="mt-3">Loading groups...</p>
              </div>
            ) : (
              <Table striped bordered hover responsive>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Title</th>
                    <th>Organization</th>
                    <th>Created At</th>
                  </tr>
                </thead>
                <tbody>
                  {groups.length > 0 ? (
                    groups.map((g, index) => (
                      <tr key={g.id}>
                        <td>{index + 1}</td>
                        <td>{g.title}</td>
                        <td>{g.organization}</td>
                        <td>{new Date(g.created_at).toLocaleString()}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="text-center">
                        No groups found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            )}
          </div>
        </Col>
      </Row>
      
      {/* NEW: Add Group Modal component */}
      <Modal show={showAddGroupModal} onHide={handleCloseModal} centered>
        <Modal.Header closeButton>
            <Modal.Title>Add New Group</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreateGroup}>
            <Modal.Body>
                {alert && alert.type === 'warning' && (
                    <Alert variant="warning" onClose={() => setAlert(null)} dismissible className="mb-3">
                        {alert.message}
                    </Alert>
                )}
                
                <Form.Group className="mb-3" controlId="formGroupTitle">
                    <Form.Label>Title</Form.Label> 
                    <Form.Control
                        type="text"
                        placeholder="Enter group name (e.g., Sales Team)"
                        value={newGroupTitle}
                        onChange={handleAddGroupChange}
                        disabled={submitting}
                        required
                    />
                </Form.Group>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleCloseModal} disabled={submitting}>
                    Cancel
                </Button>
                <Button variant="primary" type="submit" disabled={submitting || !newGroupTitle.trim()}>
                    {submitting ? (
                        <>
                            <Spinner animation="border" size="sm" className="me-2" />
                            Creating...
                        </>
                    ) : 'Create Group'}
                </Button>
            </Modal.Footer>
        </Form>
      </Modal>
    </>
  );
}

export default Groups;
