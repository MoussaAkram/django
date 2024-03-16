document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#single-email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';

  document.querySelector('#compose-form').addEventListener("submit", function(evt){
      evt.preventDefault();
    }, true);

    document.querySelector('input[type="submit"]').addEventListener('click', send_email);

}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#single-email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;


  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    console.log(emails);
    render_mails(emails, mailbox)

  })


}

function render_mails(emails, mailbox){
  let emails_views = document.querySelector('#emails-view');
  emails_views.innerHTML = '';
  emails.forEach(email => {
      let email_div = document.createElement('div');
      email_div.classList.add('email')
      if(email.read){
        email_div.style.backgroundColor = 'gray'
      }
      else{
        email_div.style.backgroundColor = 'white'
      }
      email_div.innerHTML = `
      <p>From: ${email.sender}</p>
      <p>Subject: ${email.subject}</p>
      <p>Timestamp: ${email.timestamp}</p>
      `;

      email_div.addEventListener('click', () => view_email(email.id , mailbox));
      emails_views.appendChild(email_div);
  });

}

function view_email(email_id, mailbox) {

  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#single-email-view').style.display = 'block';

  // Fetch email details
  fetch(`/emails/${email_id}`)
  .then(response => response.json())
  .then(email => {
    // Display email content
    const emailView = document.querySelector('#single-email-view');
    emailView.innerHTML = `
      <p><strong>From:</strong> ${email.sender}</p>
      <p><strong>To:</strong> ${email.recipients.join(', ')}</p>
      <p><strong>Subject:</strong> ${email.subject}</p>
      <p><strong>Timestamp:</strong> ${email.timestamp}</p>
      <hr>
      <p>${email.body}</p>
    `;
    // Show email view and hide other views
    emailView.style.display = 'block';
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'none';
    // Mark email as read if it's in the inbox
    if (emailView.style.display = 'block') {
      mark_email_as_read(email_id);
      control_archive(email_id, mailbox)
      control_reply(email)
    }
  })
  .catch(error => console.error('Error:', error));

}

function control_archive(email_id, mailbox){
  const emailView = document.querySelector('#single-email-view');

  const archiveBtn = document.createElement('button');
  archiveBtn.id = 'archive-btn';
  archiveBtn.textContent = 'Archive';
  archiveBtn.className = 'btn btn-sm btn-outline-primary';
  archiveBtn.addEventListener('click', () => mark_email_as_archived(email_id));

  const unarchiveBtn = document.createElement('button');
  unarchiveBtn.id = 'unarchive-btn';
  unarchiveBtn.textContent = 'Unarchive';
  unarchiveBtn.className = 'btn btn-sm btn-outline-primary';
  unarchiveBtn.addEventListener('click', () => mark_email_as_unarchived(email_id));

  if (mailbox === 'inbox') {
    emailView.appendChild(archiveBtn);
  } else if (mailbox === 'archive') {
    emailView.appendChild(unarchiveBtn);
  }
}

function control_reply(email){
  const emailView = document.querySelector('#single-email-view');
  const replyBtn = document.createElement('button');
    replyBtn.textContent = 'Reply';
    replyBtn.className = 'btn btn-sm btn-outline-primary';
    replyBtn.addEventListener('click', () => reply_to_email(email));

    emailView.appendChild(replyBtn);

}

function mark_email_as_read(email_id) {
  fetch(`/emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify({
      read: true
    })
  })
  .then(response => {
    if (response.ok) {
      console.log('Email marked as read');
    } else {
      console.error('Failed to mark email as read');
    }
  })
  .catch(error => console.error('Error:', error));
}
function mark_email_as_archived(email_id) {
  fetch(`/emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify({
      archived: true
    })
  })
  .then(response => {
    if (response.ok) {
      console.log('Email marked as archived');
      load_mailbox('inbox');
    } else {
      console.error('Failed to mark email as archived');
    }
  })
  .catch(error => console.error('Error:', error));
}
function mark_email_as_unarchived(email_id) {
  fetch(`/emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify({
      archived: false
    })
  })
  .then(response => {
    if (response.ok) {
      console.log('Email marked as unarchived');
      load_mailbox('inbox');
    } else {
      console.error('Failed to mark email as unarchived');
    }
  })
  .catch(error => console.error('Error:', error));
}

function reply_to_email(email) {
  compose_email();
  document.querySelector('#compose-recipients').value = email.sender;
  let subject = email.subject.startsWith('Re:') ? email.subject : `Re: ${email.subject}`;
  document.querySelector('#compose-subject').value = subject;
  let body = `On ${email.timestamp} ${email.sender} wrote:\n${email.body}\n `;
  document.querySelector('#compose-body').value = body;
}


function send_email(){
  let recipients = document.querySelector('#compose-recipients').value;
  let subject = document.querySelector('#compose-subject').value;
  let body = document.querySelector('#compose-body').value;

  fetch('/emails', {
    method : 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body : JSON.stringify({
      recipients : recipients,
      subject : subject,
      body : body

    })
  }).then(response => response.json())
    .then(() => load_mailbox('sent'))


}