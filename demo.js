import { connectToDB } from "../../middleware";
import { verify } from "jsonwebtoken";
import Groq from "groq-sdk";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    // 1. Get conversation from request
    const { messages } = await req.json();

    // 2. Decode token
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split(" ")[1];
    let userEmail = null;
    let userName = "User";
    try {
      const decoded = verify(token, process.env.JWT_SECRET);
      userEmail = decoded.email;
      userName = decoded.name || "User";
    } catch (error) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }

    // 3. Connect to DB & find docs
    const db = await connectToDB();

    // Find user docs
    const userDocs = await db
      .collection("documents")
      .find({ userEmail })
      .toArray();

    let docTexts = "";
    if (userDocs.length > 0) {
      // Combine all user doc texts
      docTexts = userDocs.map((doc) => doc.text).join("\n\n");
    } else {
      // Use default doc(s)
      const defaultDocs = await db
        .collection("documents")
        .find({ isDefault: true })
        .toArray();
      if (defaultDocs.length > 0) {
        docTexts = defaultDocs.map((doc) => doc.text).join("\n\n");
      } else {
        docTexts = "No default documents found.";
      }
    }

    // Enterprise Portal Feature Documentation (as a string)
    const enterprisePortalDocumentation = `
# Enterprise Portal - Feature Documentation

## Introduction

The Enterprise Portal is a robust Minimum Viable Product (MVP) designed to streamline and enhance workplace operations by offering a centralized system for task management, leave applications, customer complaint tracking, meeting scheduling, reimbursement requests, surveys, and AI-powered assistance. This document provides a comprehensive overview of its features, functionalities, and future improvement scope.

## Features Overview

### 1. **Dashboard**
- Provides a centralized hub with easy navigation to various features.
- Displays available functionalities such as Customer Complaints, Leave Applications, Meeting Scheduling, Task Management, Reimbursement, and Surveys.
- Clean and modern UI with intuitive buttons for seamless user interaction.

### 2. **Customer Complaints Management**
- Allows users to log and track customer complaints.
- Displays complaints in a tabular format with details such as:
  - Customer Name
  - Complaint Details
  - Urgency Level (Medium/High)
  - Status (Resolved/Pending)
  - Date Created
- Complaints can be filtered and managed effectively.
- AI Complaints Analyzer feature for intelligent complaint resolution assistance.

### 3. **Leave Management System**
- Enables employees to apply for leave by filling in details such as:
  - Name
  - Email
  - Leave Duration (From-To Dates)
  - Reason for Leave
- Provides AI-powered assistance for answering leave-related queries.
- Displays a warning note about applying for leave within 30 days of a previous leave to avoid rejection.

### 4. **Meeting Scheduling & Room Booking**
- Users can schedule meetings by entering:
  - Start and End Time
  - Department
  - Host Name & Designation
  - Expected Number of Participants
  - Meeting Room Selection
- Meeting room availability is displayed for efficient booking.
- Users can view upcoming and past meetings.

### 5. **Task Management**
- Users can create and manage tasks by entering:
  - Task Title
  - Description
  - Assignee
  - Deadline
  - Status (Pending/Done)
- Completed tasks are marked with a ‘Done’ tag.
- UI provides easy editing and deletion of tasks.

### 6. **Reimbursement Management**
- Allows employees to submit reimbursement requests by providing:
  - Amount (in USD)
  - Reason for reimbursement
  - Attachment of supporting documents
- Displays previous reimbursement requests with status:
  - Pending
  - Approved
- Shows a pop-up notice for optimal processing instructions.

### 7. **Survey System**
- Enables employees to participate in surveys related to workplace conditions.
- Ensures responses remain anonymous.
- Provides a step-by-step question interface for user convenience.

### 8. **Personal Calendar & Reminders**
- Displays a monthly calendar view for tracking important events and reminders.
- Allows users to set and edit reminders with details such as:
  - Plan Name
  - Time
  - Importance Level (High/Medium/Low)
  - Associated People
- Events are color-coded for quick visual identification.

### 9. **AI-Powered Assistance**
- Integrated AI assistant for handling user queries regarding portal functionalities.
- Available for customer complaints and leave applications.
- Provides contextual assistance with real-time responses.

## Future Scope & Enhancements

1. **Enhanced AI Assistance**
   - Expand AI capabilities to provide real-time analytics and reporting insights.
   - Implement AI-based auto-suggestions for repetitive tasks.
2. **Role-Based Access Control (RBAC)**
   - Introduce different access levels for Admins, Managers, and Employees.
   - Restrict access to sensitive data based on user roles.
3. **Integration with Third-Party Tools**
   - Google Calendar & Outlook integration for seamless scheduling.
   - Payment gateway integration for reimbursements.
4. **Advanced Analytics & Reporting**
   - Generate detailed reports on leave trends, complaints resolution time, and meeting room utilization.
   - Provide graphical dashboards for better visualization.
5. **Automated Notifications & Reminders**
   - Email & push notifications for upcoming tasks, pending approvals, and scheduled meetings.
   - SMS alerts for critical updates.
6. **Mobile App Development**
   - Create a dedicated mobile application for accessibility on the go.
   - Implement biometric authentication for secure access.
7. **Multi-Language Support**
   - Allow users to switch between different languages based on preference.
8. **Integration with HR & Payroll Systems**
   - Sync leave approvals with payroll processing.
   - Track reimbursement disbursements.

## Conclusion

The Enterprise Portal is a comprehensive workplace management solution that optimizes daily operations through structured features. With planned future enhancements, it has the potential to become a fully-fledged enterprise resource management system. The AI assistant can leverage this knowledge base to answer user queries efficiently, making the system more interactive and intelligent.
`;

    // 4. Build system instructions with doc text and the enterprise portal documentation
    const systemMessage = `
      You are a helpful personal AI assistant.
      The user's name is ${userName}.
      Answer the user's questions accurately and in a friendly, human-like tone.
      The user will ask you questions and you have to answer it very accuratly.
       Also the user might guve you content of thier document. 
      Use that content as knowledge base to answer the user's questions based on the content.
      If you don't find relevant info, you can say "I am not sure."
      As the user chats with you, you have to memorise the chats so that you can answer them accurately.
      But when the user tell you to forget the chat, you have to forget the chat.
      You should be excellent at maths, reasoning and answering questions.
      If the user asks you mathamatical and reasoning questions, you have to use your excellent intelligence to answer it so that to avoid mistakes

      Use any provided document content as well as the following Enterprise Portal Feature Documentation as your knowledge base:
      
      ${enterprisePortalDocumentation}
      Never mention such kind of statement: "Based on the document I have, or knowledge base, instead of that , directly answer the question from the knowledge base.

      If you cannot find relevant information, say "I am not sure."
      Be polite and helpful, greet them by name if possible.
      Always greet the user by name and provide clear, step-by-step reasoning when needed.
    `;

    // 5. Combine system message + user conversation
    const updatedMessages = [
      { role: "system", content: systemMessage },
      ...messages,
    ];

    // 6. Initialize Groq
    const groq = new Groq({ apiKey: process.env.GROQ });

    // 7. Call the model with streaming
    const chatCompletion = await groq.chat.completions.create({
      messages: updatedMessages,
      model: "llama3-70b-8192",
      temperature: 1,
      max_completion_tokens: 1024,
      top_p: 1,
      stream: true,
    });

    // 8. Stream back the response
    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        for await (const chunk of chatCompletion) {
          const tokenPart = chunk.choices[0]?.delta?.content || "";
          controller.enqueue(encoder.encode(tokenPart));
        }
        controller.close();
      },
    });

    return new Response(readableStream, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (error) {
    console.error("AI chat error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

