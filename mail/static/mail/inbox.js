
document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archive').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', () => compose_email('','',''));

  document.querySelector('#compose-form').onsubmit = () => {

    const recipients = document.querySelector('#compose-recipients').value;
    const subject = document.querySelector('#compose-subject').value;
    const body = document.querySelector('#compose-body').value;

    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
        recipients: recipients,
        subject: subject,
        body: body
      })
    })
    .then(response => response.json())
    .then(result => {
      if (result.error) {
        console.log(`Error: ${result.error}`);
      } else {
        load_mailbox('sent');
      }
    })
    .catch(e => console.log(e))
    return false; 
  }

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email(recipients = '', subject = '', body = '') {

  buttons = document.querySelector('#inbox-li').classList.remove('active'),
  buttons = document.querySelector('#sent-li').classList.remove('active'),
  buttons = document.querySelector('#archive-li').classList.remove('active'),


  button = document.querySelector('#compose-li');
  button.classList.add('active');

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#email-view').style.display = "none";

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = recipients;
  document.querySelector('#compose-subject').value = subject;
  document.querySelector('#compose-body').value = body;


}

function view_email(id) {

  document.querySelector('#email-view').innerHTML = ""
  // Hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'block';

  fetch(`emails/${id}`)
  .then(response => response.json())
  .then(email => {

    // Mark email as read
    fetch(`emails/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        read: true
      }) 
    });

    if (email.archived === true) {
      imglink = 'static/mail/unarchiveIcon.png';
      change = false
    } else {
      imglink = 'static/mail/trashIcon.png';
      change = true
    };

    // Construct email view
    const row = document.createElement('div');
    row.classList.add('row', 'align-items-center', 'mail-header');

    const col = document.createElement('col');
    col.classList.add('col');

    const col2 = document.createElement('col');
    col2.classList.add('col');
    col2.style.textAlign = 'right';

    const sender_user = document.createElement('span');
    sender_user.innerHTML = `<span class = "align-items-center"><strong>From: </strong>${email.sender}</span><br><span class = "align-items-center"><strong>To: </strong> ${email.recipients}</span><br><span class = "align-items-center"><strong>Subject: </strong> ${email.subject}</span>`;

    const time = document.createElement('span');
    time.innerHTML = `<p class = "font-weight-light align-items-center" style = "font-size: 10px; text-align: right;">${email.timestamp}</p>`;
    
    const paragraph = document.createElement('div');
    paragraph.innerText = email.body;

    const hr = document.createElement('hr');
    const br = document.createElement('br')
    hr.classList.add('my-4');


    const row2 = document.createElement('div');
    row2.classList.add('row');
    row2.style.marginLeft = '970px';
    row2.style.marginRight = '0';

    const col3 = document.createElement('div');
    col3.classList.add('col');
    
    const reply_btn = document.createElement('button');
    reply_btn.classList.add('btn', 'btn-info', 'btn-sm');
    reply_btn.setAttribute('id', "reply-btn");

    reply_btn.addEventListener('click', function () {
      console.log('reply button triggered');

      if (email.subject.toUpperCase().includes('RE: ')) {
        reply_subject = email.subject;
      } else {
        reply_subject = `Re: ${email.subject}`;
      }

      let sender =  email.sender;
      let subject = reply_subject;
      let content = `On ${email.timestamp}, ${email.sender} wrote:\n${email.body}\n------------------\n`;
      compose_email(sender, subject, content);
    });
 
    reply_btn.innerHTML = "<img src = 'static/mail/replyIcon.png' style = 'width:20px;'>Reply"

    col.appendChild(sender_user);
    col2.appendChild(time);

    if (email.sender != document.querySelector('#user-email').value) {
      const archive_btn = document.createElement('img');
      archive_btn.src = imglink;
      archive_btn.width = "20";
      archive_btn.addEventListener('click', () => archive(id, email.archived));
      col2.appendChild(archive_btn);
    }
  
    col3.appendChild(reply_btn);

    row.appendChild(col);
    row.appendChild(col2);
    row2.appendChild(col3);

    document.querySelector('#email-view').append(row);
    document.querySelector('#email-view').append(hr);
    document.querySelector('#email-view').append(br);
    document.querySelector('#email-view').append(paragraph);
    document.querySelector('#email-view').append(row2);

  });
}

function archive(id, status) {
  const newStatus = !status
  fetch(`emails/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      archived: newStatus
    })
  })
  load_mailbox('inbox');
  window.location.reload();
}

function load_mailbox(mailbox) {
  console.log ('now loading mailbox: ' + mailbox);

  buttons = document.querySelector('#inbox-li').classList.remove('active');
  buttons = document.querySelector('#sent-li').classList.remove('active');
  buttons = document.querySelector('#archive-li').classList.remove('active');
  buttons = document.querySelector('#compose-li').classList.remove('active');


  button = document.querySelector(`#${mailbox}-li`);
  button.classList.add('active');
   
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  //Obtain mail response
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {

    if (emails.length == 0) {
      message = document.createElement('span');
      message.innerHTML = 'No messages. ';
      message.classList.add('font-italic');
      message.style.fontSize = 'x-small';
      document.querySelector('#emails-view').appendChild(message);
    }

    // Render mails
    emails.forEach(email => {
      
      if (email.read === true) {
        bgcolor = '#f6f6f6'
      }
      else {
        bgcolor = 'ghostwhite'
      }

      const new_mail = document.createElement('div');
      new_mail.classList.add('row', 'align-items-center');
      new_mail.style.backgroundColor = bgcolor;
      new_mail.style.borderColor = 'black';
      new_mail.style.height = '50px';
      new_mail.style.borderRadius = '15px';
      new_mail.style.margin = '5px'

      const col_1 = document.createElement('div');
      
      if (mailbox === 'sent') {
        col_1.innerHTML = `<div class="form-check">
                            <input class="form-check-input" type="checkbox" value="" id="flexCheckDefault">
                            <label class="form-check-label" for="flexCheckDefault" style = "font-size:12px";>
                            sent to: ${email.recipients}
                            </label>
                           </div>`;
        col_1.classList.add('col-4', 'font-weight-bold');
      } else {
        col_1.innerHTML = `<div class="form-check">
        <input class="form-check-input" type="checkbox" value="" id="flexCheckDefault">
        <label class="form-check-label" for="flexCheckDefault">
        ${email.sender}
        </label>
      </div>`;
        col_1.classList.add('col-4', 'font-weight-bold');
      }

      const col_2 = document.createElement('div');
      if (mailbox === 'sent') {
        col_2.classList.add('col-6');
      } else {
        col_2.classList.add('col-6');
      }

      const subject = document.createElement('a');
      subject.innerHTML = email.subject;
      subject.classList.add('stretched-link');

      col_2.appendChild(subject)
      col_2.addEventListener('click', () => {view_email(email.id); });
      const col_3 = document.createElement('div');
      col_3.classList.add('col', 'timestamp_col');
      col_3.innerHTML = email.timestamp;

      new_mail.appendChild(col_1);
      new_mail.appendChild(col_2);
      new_mail.appendChild(col_3);

      document.querySelector('#emails-view').append(new_mail);
      });
  })

}