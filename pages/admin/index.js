import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { verifyAuthToken } from '../../lib/auth';
import { parseCookies } from '../../lib/auth';

function initialFormState() {
  return {
    id: '',
    title: '',
    image: '',
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
  return typeof image === 'string' && (image.startsWith('/uploads/') || image.startsWith('http'));
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
  const [defaultStoryImage, setDefaultStoryImage] = useState('/images/profilepic.jpg');
  const [defaultImagePreview, setDefaultImagePreview] = useState('/images/profilepic.jpg');
  const [pendingDefaultImage, setPendingDefaultImage] = useState(null);

  useEffect(() => {
    fetchPosts();
    fetchUsers();
    fetchSettings();
  }, []);

  async function fetchSettings() {
    const response = await fetch('/api/settings');
    if (!response.ok) {
      if (response.status === 401) {
        router.push('/admin/login');
        return;
      }
      try {
        const txt = await response.text();
        setStatus(`Failed to load settings: ${txt}`);
      } catch (e) {
        setStatus('Failed to load settings.');
      }
      return;
    }

    let data;
    try {
      data = await response.json();
    } catch (e) {
      setStatus('Invalid settings response from server.');
      return;
    }

    const imagePath = data.default_image_url || '/images/profilepic.jpg';
    setDefaultStoryImage(imagePath);
    setDefaultImagePreview(imagePath);
  }

  async function fetchPosts() {
    const response = await fetch('/api/posts');
    if (!response.ok) {
      try {
        const txt = await response.text();
        setStatus(`Failed to load posts: ${txt}`);
      } catch (e) {
        setStatus('Failed to load posts.');
      }
      return;
    }

    let data;
    try {
      data = await response.json();
    } catch (e) {
      setStatus('Invalid posts response from server.');
      return;
    }

    setPosts(data.posts || []);
  }

  async function fetchUsers() {
    const response = await fetch('/api/auth/users');
    if (!response.ok) {
      if (response.status === 401) {
        router.push('/admin/login');
        return;
      }
      try {
        const txt = await response.text();
        setStatus(`Failed to load users: ${txt}`);
      } catch (e) {
        setStatus('Failed to load users.');
      }
      return;
    }

    let data;
    try {
      data = await response.json();
    } catch (e) {
      setStatus('Invalid users response from server.');
      return;
    }

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
    setImagePreview(defaultStoryImage);
    setPendingImage(null);
    setImageToDelete('');
    setStatus('Creating a new story. Fill in the fields and save.');
  }

  function editStory(post) {
    setFormState(post);
    setImagePreview(post.image || defaultStoryImage);
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
      setFormState((prev) => ({ ...prev, image: '' }));
      setStatus('Image selected, save the story to upload the image.');
    };
    reader.readAsDataURL(file);
  }

  async function uploadDefaultImage(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64Content = reader.result.split(',')[1];
      setPendingDefaultImage({ fileName: file.name, contentBase64: base64Content });
      setDefaultImagePreview(reader.result);
      setStatus('Default image selected. Save it to update the site default.');
    };
    reader.readAsDataURL(file);
  }

  async function saveDefaultImage() {
    if (!pendingDefaultImage) {
      setStatus('Select a default image first.');
      return;
    }

    try {
      const imagePath = await uploadMediaFile(pendingDefaultImage);
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ default_image_url: imagePath }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to save default story image.');
      }

      const data = await response.json();
      setDefaultStoryImage(data.default_image_url);
      setDefaultImagePreview(data.default_image_url);
      setPendingDefaultImage(null);
      setStatus('Default story image updated successfully.');
    } catch (error) {
      setStatus(error.message);
    }
  }

  async function uploadMediaFile(fileData) {
    const response = await fetch('/api/media', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(fileData),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Image upload failed');
    }

    const data = await response.json();
    return data.path;
  }

  async function removeImage() {
    if (pendingImage) {
      setPendingImage(null);
      setImagePreview(defaultStoryImage);
      setFormState((prev) => ({ ...prev, image: '' }));
      setStatus('Image selection canceled.');
      return;
    }

    if (isManagedUpload(formState.image)) {
      setImageToDelete(formState.image);
    }

    setFormState((prev) => ({ ...prev, image: '' }));
    setImagePreview(defaultStoryImage);
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
      if (!imagePath || imagePath === '/images/profilepic.jpg') {
        imagePath = defaultStoryImage;
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
      setImagePreview(defaultStoryImage);
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
    setImagePreview(defaultStoryImage);
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
      {posts.length > 20 ? (
        <div className="alert" style={{ marginTop: '1rem' }}>
          Number of stories is exceeding the limit please delete old and irrelevant stories.
        </div>
      ) : null}

      <div className="grid" style={{ gridTemplateColumns: '1fr 1.6fr', gap: '1.5rem', marginTop: '2rem' }}>
        <aside>
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h2 className="card-title">Users</h2>
            <div>
              <div className="field">
                <label htmlFor="newUsername">Username</label>
                <input id="newUsername" type="text" name="username" value={userForm.username} onChange={handleUserChange} />
              </div>
              <div className="field">
                <label htmlFor="newPassword">Password</label>
                <input id="newPassword" name="password" type="password" value={userForm.password} onChange={handleUserChange} />
              </div>
              {userRole === 'master' ? (
                <div className="field">
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

          {userRole === 'master' ? (
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <h2 className="card-title">Default Story Image</h2>
              <div className="field">
                <label>Current Default Image</label>
                <img src={defaultImagePreview} alt="Default story image" style={{ width: '100%', maxWidth: 320, borderRadius: 18, objectFit: 'cover' }} />
              </div>
              <div className="field">
                <label htmlFor="defaultImageUpload">Upload New Default Image</label>
                <input id="defaultImageUpload" type="file" accept="image/*" onChange={uploadDefaultImage} />
                <small>Upload a new default image for stories that don't include a photo.</small>
              </div>
              <button type="button" className="button" onClick={saveDefaultImage} disabled={!pendingDefaultImage}>
                Save Default Image
              </button>
            </div>
          ) : null}

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
                      {(user.username === username || (userRole === 'master' && (username === 'masteradmin' || user.username !== 'masteradmin'))) && (
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
                <input id="youtubeVideoUrl" name="youtubeVideoUrl" value={formState.youtubeVideoUrl} onChange={handleChange} placeholder="https://www.youtube.com/embed/..." />
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
