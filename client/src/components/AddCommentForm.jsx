import { useState } from "react";
import axios from "axios";
import useUser from "../hooks/useUser";

function AddCommentForm({ articleName, onArticleUpdated }) {
  const [name, setName] = useState("");
  const [commentText, setCommentText] = useState("");
  const { user } = useUser();

  async function addComment() {
    const token = user && (await user.getIdToken());
    const headers = token ? { authtoken: token } : {}; // empty object to avoid axios returning a string with the value "null"
    const reponse = await axios.post(
      `http://localhost:8000/api/articles/${articleName}/comments`,
      {
        postedBy: name,
        text: commentText,
      },
      { headers }
    );

    // Update article data after comment has been posted
    const updatedArticle = reponse.data;
    onArticleUpdated(updatedArticle);
    setName("");
    setCommentText("");
  }

  return (
    <div id="add-comment-form">
      <h3>Add a comment</h3>
      {user && <p>You are posting as {user.email}</p>}
      <textarea
        value={commentText}
        onChange={(event) => setCommentText(event.target.value)}
        rows="4"
        cols="50"
      />
      <button onClick={addComment}>Add comment</button>
    </div>
  );
}

export default AddCommentForm;
