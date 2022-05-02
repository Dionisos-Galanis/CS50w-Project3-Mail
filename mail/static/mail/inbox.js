document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', () => compose_email('', '', ''));

  document.querySelector('#send-email').addEventListener('click', function(event){
    send_email();
    event.preventDefault();
  });

  // By default, load the inbox
  load_mailbox('inbox');
});

function read_email(emailId, mailbox = 'undefined') {
  // Get a message
  fetch(`/emails/${emailId}`)
  .then(response => response.json())
  .then(email => {
    // Show email read view and hide other views
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'none';
    document.querySelector('#read-email-view').style.display = 'block';

    // Set all email fields
    document.querySelector('#read-subject').innerHTML = email.subject;
    document.querySelector('#read-timestamp').innerHTML = email.timestamp;
    document.querySelector('#read-from').innerHTML = `From: ${email.sender}`;
    document.querySelector('#read-to').innerHTML = `To: ${email.recipients}`;
    document.querySelector('#read-body').innerHTML = email.body;

    // Handle extra buttons depending of type of mailbox, the letter belongs to
    // First Remove all extra buttons if present
    if (!!document.getElementById('reply')) {
      document.getElementById('reply').remove();
    }
    if (!!document.getElementById('archive')) {
      document.getElementById('archive').remove();
    }
    if (!!document.getElementById('unarchive')) {
      document.getElementById('unarchive').remove();
    }

    const readEmlDiv = document.querySelector('#read-email-view');

    switch (mailbox) {
      case 'inbox':
        // Reply button
        const replyBut = document.createElement('button');
        replyBut.setAttribute('class', 'btn btn-sm btn-outline-primary');
        replyBut.setAttribute('id', 'reply');
        replyBut.innerHTML = 'Reply';
        readEmlDiv.appendChild(replyBut);
        document.querySelector('#reply').addEventListener('click', () => {compose_email(
          email.sender,
          email.subject.substr(0, 4) == 'Re: ' ? email.subject : 'Re: ' + email.subject,
          `\n\nOn ${email.timestamp} ${email.sender} wrote:\n` + email.body
        )});

        // Archive button
        const archiveBut = document.createElement('button');
        archiveBut.setAttribute('class', 'btn btn-sm btn-outline-primary');
        archiveBut.setAttribute('id', 'archive');
        archiveBut.innerHTML = 'Archive';
        readEmlDiv.appendChild(archiveBut);
        document.querySelector('#archive').addEventListener('click', () => {
          fetch(`/emails/${emailId}`, {
            method: 'PUT',
            body: JSON.stringify({
              archived: true
            })
          })
          .then(() => load_mailbox('inbox'));
        });
        break;
      case 'archive':
        // Add Unarchive button
        const unarchiveBut = document.createElement('button');
        unarchiveBut.setAttribute('class', 'btn btn-sm btn-outline-primary');
        unarchiveBut.setAttribute('id', 'unarchive');
        unarchiveBut.innerHTML = 'Unarchive';
        readEmlDiv.appendChild(unarchiveBut);
        document.querySelector('#unarchive').addEventListener('click', () => {
          fetch(`/emails/${emailId}`, {
            method: 'PUT',
            body: JSON.stringify({
              archived: false
            })
          })
          .then(() => load_mailbox('inbox'));
        });
        break;
    }

    fetch(`/emails/${emailId}`, {
      method: 'PUT',
      body: JSON.stringify({
          read: true
      })
    })
  });
}

function send_email() {
  console.log('Send email start');
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
        recipients: document.querySelector('#compose-recipients').value,
        subject: document.querySelector('#compose-subject').value,
        body: document.querySelector('#compose-body').value
    })
  })
  .then(response => response.json())
  .then(result => {
      // Print result
      console.log(result);
      load_mailbox('sent');
      console.log('after load sent') 
  });
}

function compose_email(recepient = '', subject = '', body = '') {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#read-email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = recepient;
  document.querySelector('#compose-subject').value = subject;
  document.querySelector('#compose-body').value = body;
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#read-email-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Get div to insert e-mails in
  const mailboxDiv = document.querySelector('#emails-view');

  // // Clearing this div contetnt
  // mailboxDiv.innerHTML = '';

  // Get all emails fom this mailbox
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    // Print emails headers as divs
    emails.forEach(email => {
      const emlDiv = document.createElement("div");
      emlDiv.setAttribute('class', 'single-eml-block');
      emlDiv.setAttribute('onclick', `read_email(${email.id}, '${mailbox}')`);
      if (email.read) {
        emlDiv.classList.add('read');
      }
      
      const timestampDiv = document.createElement("div");
      timestampDiv.setAttribute('class', 'timestamp-div');
      timestampDiv.innerHTML = email.timestamp;
      emlDiv.appendChild(timestampDiv);

      const senderDiv = document.createElement("div");
      senderDiv.setAttribute('class', 'sender-div');
      senderDiv.innerHTML = `From: ${email.sender}`;
      emlDiv.appendChild(senderDiv);
      
      const recipientsDiv = document.createElement("div");
      recipientsDiv.setAttribute('class', 'recipients-div');
      recipientsDiv.innerHTML = `To: ${email.recipients}`;
      emlDiv.appendChild(recipientsDiv);
      
      const subjectDiv = document.createElement("div");
      subjectDiv.setAttribute('class', 'subjectDiv');
      subjectDiv.innerHTML = email.subject;
      emlDiv.appendChild(subjectDiv);

      mailboxDiv.appendChild(emlDiv);
    });
  });
}