import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPencil, faTrash, faPlus, faBan } from '@fortawesome/free-solid-svg-icons';
import { AuthContext } from '../../context/AuthContext';
import TopBar from '../../Components/TopBar/TopBar';
import Sidebar from '../../Components/SideBar/SideBar';
import {Row, Col} from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import CreateOrganization from './CreateOrganization';


const AccessDeniedMessage = () => (
    <div className="text-center p-5 bg-light rounded shadow-sm mx-auto my-5" style={{ maxWidth: '600px' }}>
        <FontAwesomeIcon icon={faBan} size="3x" className="text-danger mb-3" />
        <h3 className="text-danger fw-bold">Access Denied</h3>
        <p className="text-muted">You do not have the required **Super Admin** permissions to view this organization management page.</p>
    </div>
);

const OrganizationsTable = ({ organizations }) => {
    const navigate = useNavigate();
    const handleEdit = (orgId) => {
        navigate(`/organization/${orgId}`);
    };

    const handleDelete = (orgId) => {
        console.log(`Deleting organization: ${orgId}`);
    };

    if (organizations.length === 0) {
        return <p className="text-center p-4 text-muted">No organizations have been created yet.</p>;
    }

    return (
        <div className="table-responsive">
            <table className="table table-hover bordered striped align-middle">
                <thead className="table-light">
                    <tr>
                        <th scope="col" className="text-muted fw-normal">#</th>
                        <th scope="col" className="text-muted fw-normal">Title</th>
                        <th scope="col" className="text-muted fw-normal">Created At</th>
                        <th scope="col" className="text-center text-muted fw-normal">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {organizations.map((org, index) => (
                        <tr key={org.id}>
                            <td className="text-secondary">{index + 1}</td>
                            <td className="fw-semibold">{org.title}</td>
                            <td>{new Date(org.created_at).toLocaleDateString()}</td> 
                            <td className="text-center">
                                <button
                                    className="btn btn-outline-primary btn-sm me-2 border-0"
                                    title="Edit Organization"
                                    onClick={() => handleEdit(org.id)}
                                >
                                    <FontAwesomeIcon icon={faPencil} />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

function Organization() {
    const { user, accessToken } = useContext(AuthContext);
    const [errorMsg, setErrorMsg] = useState("");
    const [loading, setLoading] = useState(true);
    const [organizations, setOrganizations] = useState([]);
    const nav = useNavigate();

    useEffect(() => {
        const fetchOrganizations = async () => {
            if (!user || user.role !== "Super Admin") {
                setLoading(false);
                return;
            }

            setLoading(true);
            setErrorMsg("");

            try {
                const response = await axios.get('http://localhost:3000/organization/all-organizations', {
                    headers: {
                        "Authorization": `Bearer ${accessToken}`
                    }
                });
                setOrganizations(response.data.organizations);
            } catch (err) {
  console.error("Failed to fetch organizations:", err);

  if (err.response) {
    if (err.response.status === 404) {
      setErrorMsg(err.response.data.message || "No organizations found yet.");
    } else if (err.response.status === 401) {
      setErrorMsg("Unauthorized. Please log in again.");
    } else {
      setErrorMsg(`Server Error: ${err.response.data.message || "Something went wrong."}`);
    }
  } else if (err.request) {
    setErrorMsg("No response from server. Check your internet connection or backend server.");
  } else {
    setErrorMsg("Unexpected error occurred.");
  }

  setOrganizations([]);
            } finally {
                setLoading(false);
            }
        };

        if (user && accessToken) {
            fetchOrganizations();
        } else {
             setLoading(false);
        }
    }, [accessToken, user]);

    const createOrganization = (e)=>{
      e.preventDefault();
      nav('/new-organization')
    }

    if (!user || user.role !== "Super Admin") {
        return (
            <>
                <TopBar />
                <Sidebar />
                <div className="container-fluid mt-4">
                    <AccessDeniedMessage />
                </div>
            </>
        );
    }
    return (
        <>
            <TopBar />
            <Row>
              <Col xs={2} md={2}>
                <Sidebar />  
              </Col>
              <Col md={10}>
                            <div className="container-fluid form-box">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h2 className="fw-light text-secondary">Organization Management</h2>
                    <button
                        className="btn btn-primary d-flex align-items-center shadow-sm"
                        title="Add New Organization"
                        onClick={createOrganization}
                    >
                        <FontAwesomeIcon icon={faPlus} className="me-2"  />
                        Add Organization
                    </button>
                </div>
                <p>Create and Manage organizations</p>
                <div className="card shadow-sm border-0">
                    <div className="card-body p-0"> 
                        {loading && (
                            <div className="text-center p-5">
                                <div className="spinner-border text-primary" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                                <p className="mt-2 text-muted">Loading data...</p>
                            </div>
                        )}

                        {errorMsg && (
                            <div className="alert alert-danger mb-0 rounded-0 text-center" role="alert">
                                {errorMsg}
                            </div>
                        )}

                        {!loading && !errorMsg && (
                            <OrganizationsTable organizations={organizations} />
                        )}
                    </div>
                </div>
            </div>
              </Col>
            </Row>
        </>
    );
}

export default Organization;