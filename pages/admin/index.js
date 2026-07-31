import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { verifyAuthToken } from '../../lib/auth';
import { parseCookies } from '../../lib/auth';

function initialFormState() {
  return {
    id: '',
    title: '',
    image: '/images/profilepic.jpg',
    youtubeVideoUrl: '',
    description: '',
    content: '',
  };
}

function initialUserForm() {
  return {
    username: '',
    password: '',
    role: 'editor',
  };
}

function isManagedUpload(image) {
  return typeof image === 'string' && image.startsWith('/uploads/');
}

export default function AdminDashboard({ username }) {
  const router = useRouter();
  const [posts, setPosts] = useState([]);
  const [users, setUsers] = useState([]);
  const [userRole, setUserRole] = useState('editor');
  const [userForm, setUserForm] = useState(initialUserForm());
  const [formState, setFormState] = useState(initialFormState());
  const [status, setStatus] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [pendingImage, setPendingImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('/images/profilepic.jpg');
  const [imageToDelete, setImageToDelete] = useState('');

  useEffect(() => {
    fetchPosts();
    fetchUsers();
  }, []);

  async function fetchPosts() {
    const response = await fetch('/api/posts');
    const data = await response.json();
    setPosts(data.posts || []);
  }

  async function fetchUsers() {
    const response = await fetch('/api/auth/users');
    const data = await response.json();
    const userList = data.users || [];
    setUsers(userList);
    const me = userList.find((user) => user.username === username);
    setUserRole(me?.role || 'editor');
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  }

  function handleUserChange(event) {
    const { name, value } = event.target;
    setUserForm((prev) => ({ ...prev, [name]: value }));
  }

  function startNewStory() {
    setFormState(initialFormState());
    setImagePreview('/images/profilepic.jpg');
    setPendingImage(null);
    setImageToDelete('');
    setStatus('Creating a new story. Fill in the fields and save.');
  }

  function editStory(post) {
    setFormState(post);
    setImagePreview(post.image || '/images/profilepic.jpg');
    setPendingImage(null);
    setImageToDelete('');
    setStatus(`Editing story: ${post.title}`);
  }

  async function uploadImage(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64Content = reader.result.split(',')[1];
      setPendingImage({ fileName: file.name, contentBase64: base64Content });
      setImagePreview(reader.result);
      setFormState((prev) => ({ ...prev, image: `/uploads/${file.name}` }));
      setStatus('Image selected, save the story to upload the image.');
    };
    reader.readAsDataURL(file);
  }

  async function removeImage() {
    if (pendingImage) {
      setPendingImage(null);
      setImagePreview('/images/profilepic.jpg');
      setFormState((prev) => ({ ...prev, image: '/images/profilepic.jpg' }));
      setStatus('Image selection canceled.');
      return;
    }

    if (isManagedUpload(formState.image)) {
      setImageToDelete(formState.image);
    }

    setFormState((prev) => ({ ...prev, image: '/images/profilepic.jpg' }));
    setImagePreview('/images/profilepic.jpg');
    setStatus('Image removed. Save story to apply the change.');
  }

  async function uploadPendingImage() {
    if (!pendingImage) {
      return formState.image;
    }

    const response = await fetch('/api/media', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileName: pendingImage.fileName,
        contentBase64: pendingImage.contentBase64,
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Image upload failed');
    }

    const data = await response.json();
    return data.path;
  }

  async function saveStory(event) {
    event.preventDefault();
    setIsSaving(true);
    setStatus('Saving story...');

    try {
      let imagePath = formState.image;
      if (pendingImage) {
        imagePath = await uploadPendingImage();
      }

      const body = {
        ...formState,
        image: imagePath,
      };

      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Save failed.');
      }

      if (imageToDelete && imageToDelete !== imagePath) {
        await fetch('/api/media', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imagePath: imageToDelete }),
        });
      }

      setIsSaving(false);
      setPendingImage(null);
      setImageToDelete('');
      setStatus('Story saved successfully.');
      setFormState(initialFormState());
      setImagePreview('/images/profilepic.jpg');
      fetchPosts();
    } catch (error) {
      setIsSaving(false);
      setStatus(error.message);
    }
  }

  async function deleteStory(id, image) {
    if (!window.confirm('Delete this story from the repository?')) {
      return;
    }

    const response = await fetch('/api/posts', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id, image }),
    });

    if (!response.ok) {
      const data = await response.json();
      setStatus(data.message || 'Delete failed.');
      return;
    }

    setStatus('Story deleted successfully.');
    setFormState(initialFormState());
    setImagePreview('/images/profilepic.jpg');
    setPendingImage(null);
    setImageToDelete('');
    fetchPosts();
  }

  async function createUser() {
    if (!userForm.username || !userForm.password) {
      setStatus('User creation requires username and password.');
      return;
    }

    try {
      const response = await fetch('/api/auth/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userForm),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create user.');
      }

      setUserForm(initialUserForm());
      setStatus(`User ${data.user.username} created.`);
      fetchUsers();
    } catch (error) {
      setStatus(error.message);
    }
  }

  async function resetUserPassword(targetUsername) {
    const newPassword = window.prompt(`Enter new password for ${targetUsername}:`);
    if (!newPassword) {
      return;
    }

    try {
      const response = await fetch('/api/auth/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: targetUsername, newPassword }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to reset password.');
      }

      setStatus(`Password reset for ${targetUsername}.`);
      fetchUsers();
    } catch (error) {
      setStatus(error.message);
    }
  }

  async function deleteUserAccount(targetUsername) {
    if (!window.confirm(`Delete user ${targetUsername}? This cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch('/api/auth/users', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: targetUsername }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete user.');
      }

      setStatus(data.message);
      fetchUsers();
    } catch (error) {
      setStatus(error.message);
    }
  }

  async function handleLogout() {
    await fetch('/api/auth/logout');
    router.push('/admin/login');
  }

  return (
    <main className="container" style={{ paddingTop: '3rem', paddingBottom: '3rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <span className="section-heading">Admin Dashboard</span>
          <h1 className="page-title">Manage users and repository stories</h1>
          <p className="page-subtitle">Logged in as {username} ({userRole}).</p>
        </div>
        <button onClick={handleLogout} className="button" style={{ alignSelf: 'center' }}>
          Logout
        </button>
      </div>

      {status ? <div className="alert" style={{ marginTop: '1rem' }}>{status}</div> : null}

      <div className="grid" style={{ gridTemplateColumns: '1fr 1.6fr', gap: '1.5rem', marginTop: '2rem' }}>
        <aside>
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h2 className="card-title">Users</h2>
            <div>
              <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="newUsername">Username</label>
                <input id="newUsername" name="username" value={userForm.username} onChange={handleUserChange} />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="newPassword">Password</label>
                <input id="newPassword" name="password" type="password" value={userForm.password} onChange={handleUserChange} />
              </div>
              {userRole === 'master' ? (
                <div style={{ marginBottom: '1rem' }}>
                  <label htmlFor="newRole">Role</label>
                  <select id="newRole" name="role" value={userForm.role} onChange={handleUserChange}>
                    <option value="editor">editor</option>
                    <option value="master">master</option>
                  </select>
                </div>
              ) : null}
              <button type="button" className="button" onClick={createUser}>
                Create User
              </button>
            </div>
          </div>

          <div className="card">
            <h2 className="card-title">All Users</h2>
            {users.length === 0 ? (
              <p>No users found.</p>
            ) : (
              users.map((user) => (
                <div key={user.username} className="card" style={{ padding: '1rem', marginBottom: '1rem' }}>
                  <h3 className="card-title" style={{ marginBottom: '0.5rem' }}>{user.username}</h3>
                  <p className="card-text">Role: {user.role}</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {(user.username === username || userRole === 'master') && (
                      <button type="button" className="btn btn-secondary" onClick={() => resetUserPassword(user.username)}>
                        Reset Password
                      </button>
                    )}
                    {userRole === 'master' && user.username !== 'masteradmin' ? (
                      <button type="button" className="btn btn-secondary" onClick={() => deleteUserAccount(user.username)}>
                        Delete User
                      </button>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>

        <section>
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
              <h2 className="card-title">Story Editor</h2>
              <button type="button" className="button" onClick={startNewStory}>New Story</button>
            </div>
            <form onSubmit={saveStory} className="form-grid">
              <div className="field">
                <label htmlFor="title">Title</label>
                <input id="title" name="title" value={formState.title} onChange={handleChange} required />
              </div>

              <div className="field">
                <label htmlFor="imageUpload">Upload Image</label>
                <input id="imageUpload" type="file" accept="image/*" onChange={uploadImage} />
                <small>Upload a photo and save the story to persist it in the repository.</small>
              </div>

              <div className="field">
                <label>Current Image</label>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <img src={imagePreview} alt="Image preview" style={{ width: 120, borderRadius: 16, objectFit: 'cover' }} />
                  <button type="button" className="btn btn-secondary" onClick={removeImage}>Remove Image</button>
                </div>
              </div>

              <div className="field">
                <label htmlFor="youtubeVideoUrl">YouTube Embed URL</label>
                <input id="youtubeVideoUrl" name="youtubeVideoUrl" value={formState.youtubeVideoUrl} onChange={handleChange} />
                <small>Example: https://www.youtube.com/embed/dQw4w9WgXcQ</small>
              </div>

              <div className="field">
                <label htmlFor="description">Short Description</label>
                <textarea id="description" name="description" value={formState.description} onChange={handleChange} required />
              </div>

              <div className="field">
                <label htmlFor="content">Full Content</label>
                <textarea id="content" name="content" value={formState.content} onChange={handleChange} required />
                <small>Markdown is supported in the published article body.</small>
              </div>

              <button type="submit" className="button" disabled={isSaving}>
                {isSaving ? 'Saving…' : 'Save Story'}
              </button>
            </form>
          </div>

          <div className="card">
            <h2 className="card-title">Existing Stories</h2>
            <div className="post-list">
              {posts.length === 0 ? (
                <p>No stories found.</p>
              ) : (
                posts.map((post) => (
                  <div key={post.id} className="card" style={{ padding: '1rem', marginBottom: '1rem' }}>
                    <h3 className="card-title">{post.title}</h3>
                    <p className="card-text">{post.description}</p>
                    <div className="admin-actions" style={{ gap: '0.5rem' }}>
                      <button type="button" className="btn btn-secondary" onClick={() => editStory(post)}>
                        Edit
                      </button>
                      <button type="button" className="btn btn-secondary" onClick={() => deleteStory(post.id, post.image)}>
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export async function getServerSideProps({ req }) {
  const cookies = parseCookies(req.headers.cookie || '');
  const username = verifyAuthToken(cookies.dp_auth);
  if (!username) {
    return {
      redirect: {
        destination: '/admin/login',
        permanent: false,
      },
    };
  }

  return {
    props: { username },
  };
}
