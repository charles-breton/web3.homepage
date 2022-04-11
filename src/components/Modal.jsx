import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { CSSTransition } from "react-transition-group";
import "./Modal.css";

const Modal = (props) => {
  const [title, setTitle] = useState("");
  const [iframe, setIframe] = useState("");

  const [isOpen, setIsOpen] = useState("");

  const closeOnEscapeKeyDown = (e) => {
    if ((e.charCode || e.keyCode) === 27) {
      props.onClose();
    }
  };

  useEffect(() => {
    localStorage.setItem("modalData", null);
    document.body.addEventListener("keydown", closeOnEscapeKeyDown);
    return function cleanup() {
      document.body.removeEventListener("keydown", closeOnEscapeKeyDown);
    };
  }, []);

  useEffect(() => {
    var projectToDisplay = JSON.parse(localStorage.getItem("modalData"));
    if (projectToDisplay !== null) {
      setTitle(projectToDisplay[0]);
      setIframe(projectToDisplay[1]);
    }
  });

  return ReactDOM.createPortal(
    <CSSTransition
      in={props.show}
      unmountOnExit
      timeout={{ enter: 0, exit: 300 }}
    >
      <div className="modal" onClick={props.onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h4 className="modal-title">
              {title}
              <span onClick={props.onClose} className="close-button">
                ×
              </span>
            </h4>
          </div>
          <div className="modal-body">
            <iframe
              className="iframe"
              title="Figma Frame"
              width="100%"
              height="100%"
              src={iframe}
              allowfullscreen
            ></iframe>
          </div>
        </div>
      </div>
    </CSSTransition>,
    document.getElementById("root")
  );
};

export default Modal;
