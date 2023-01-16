// localhost:3000/articles/learn-node
import { useParams } from "react-router-dom";
import articles from "./article-content";
import NotFoundPage from "./NotFoundPage";
import { useState, useEffect } from "react";
import axios from "axios";
import CommentsList from "../components/CommentsList";
import AddCommentForm from "../components/AddCommentForm";
import useUser from "../hooks/useUser";

function ArticlePage() {
  const params = useParams();
  const articleId = params.articleId;
  const article = articles.find((article) => article.name === articleId);
  const [articleInfo, setArticleInfo] = useState({ upvotes: 0, comments: [], canUpvote: false });
  const { canUpvote } = articleInfo;  
  const { user, isLoading } = useUser();

  useEffect(() => {
    async function loadArticleInfo() {
      const token = user && await user.getIdToken();
      const headers = token ? { authtoken: token } : {}; // empty object to avoid axios returning a string with the value "null"
      const response = await axios.get(
        `http://localhost:8000/api/articles/${articleId}`,
        { headers } // This is how you include headers with axios get
      );
      const newArticleInfo = response.data;
      setArticleInfo(newArticleInfo);
    }
    
    // Only update article info when user is not currently logging in
    if (!isLoading) {
      loadArticleInfo();      
    }    
  }, [isLoading, user]);

  async function addUpvote() {
    const token = user && await user.getIdToken();
    const headers = token ? { authtoken: token } : {}; // empty object to avoid axios returning a string with the value "null"
    const response = await axios.put(
      `http://localhost:8000/api/articles/${articleId}/upvote`,
      null,
      { headers }
    );
    const updatedArticle = response.data;
    setArticleInfo(updatedArticle);
  }

  if (!article) {
    return <NotFoundPage />;
  }

  return (
    <>
      <h1>{article.title}</h1>
      <div className="upvotes-section">
        {user
          ? <button onClick={addUpvote}>{ canUpvote ? "Upvote" : "Already upvoted" }</button>
          : <button>Log in to upvote</button>
        }        
        <p>This article has {articleInfo.upvotes} upvote(s)</p>
      </div>
      {/* Each article has several paragraphs that we map here */}
      {article.content.map((paragraph, i) => (
        <p key={i}>{paragraph}</p>
      ))}
      
      {user
          ? <AddCommentForm
              articleName={articleId}
              onArticleUpdated={updatedArticle => setArticleInfo(updatedArticle)}      
            />
          : <button>Log in to add a comment</button>
        }     
      
      <CommentsList comments={articleInfo.comments} />
    </>
  );
}

export default ArticlePage;
