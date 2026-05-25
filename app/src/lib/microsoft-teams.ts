/**
 * Microsoft Teams API client for chat and collaboration features
 * Provides functions to send messages, create meetings, and manage channels
 */

export interface TeamsChatMessage {
  id: string;
  createdDateTime: string;
  body: {
    content: string;
    contentType: "text" | "html";
  };
  from: {
    user: {
      displayName: string;
      id: string;
    };
  };
}

export interface TeamsOnlineMeeting {
  id: string;
  joinWebUrl: string;
  subject: string;
  startDateTime: string;
  endDateTime: string;
  participants?: {
    organizer: {
      identity: {
        user: {
          displayName: string;
          id: string;
        };
      };
    };
  };
}

export interface AdaptiveCard {
  type: "AdaptiveCard";
  version: string;
  body: any[];
  actions?: any[];
}

/**
 * Send a notification to user's Teams activity feed
 * This is simpler than chat messages and works with basic permissions
 */
export async function sendActivityNotification(
  accessToken: string,
  title: string,
  body: string,
  webUrl: string
): Promise<void> {
  const userResponse = await fetch("https://graph.microsoft.com/v1.0/me", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!userResponse.ok) {
    throw new Error("Failed to get user profile");
  }

  const user = await userResponse.json();

  const response = await fetch(
    `https://graph.microsoft.com/v1.0/users/${user.id}/teamwork/sendActivityNotification`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        topic: {
          source: "text",
          value: title,
        },
        activityType: "taskCreated",
        previewText: {
          content: body,
        },
        templateParameters: [
          {
            name: "taskName",
            value: title,
          },
        ],
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to send activity notification: ${response.status} ${error}`);
  }
}

/**
 * Send a chat message to the user (self-chat)
 * Note: This requires Chat.ReadWrite permission and may not work for self-chats
 * Consider using sendActivityNotification instead for simpler notifications
 */
export async function sendChatMessage(
  accessToken: string,
  message: string,
  contentType: "text" | "html" = "text"
): Promise<TeamsChatMessage> {
  // First, get or create a chat with self
  const chatId = await getOrCreateSelfChat(accessToken);

  const response = await fetch(
    `https://graph.microsoft.com/v1.0/chats/${chatId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        body: {
          content: message,
          contentType,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to send Teams message: ${response.status} ${error}`);
  }

  return await response.json();
}

/**
 * Send an Adaptive Card to Teams chat
 */
export async function sendAdaptiveCard(
  accessToken: string,
  card: AdaptiveCard
): Promise<TeamsChatMessage> {
  const chatId = await getOrCreateSelfChat(accessToken);

  const response = await fetch(
    `https://graph.microsoft.com/v1.0/chats/${chatId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        body: {
          contentType: "html",
          content: `<attachment id="adaptive-card"></attachment>`,
        },
        attachments: [
          {
            id: "adaptive-card",
            contentType: "application/vnd.microsoft.card.adaptive",
            content: JSON.stringify(card),
          },
        ],
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to send Adaptive Card: ${response.status} ${error}`);
  }

  return await response.json();
}

/**
 * Create a Teams online meeting
 */
export async function createOnlineMeeting(
  accessToken: string,
  subject: string,
  startDateTime: string,
  endDateTime: string
): Promise<TeamsOnlineMeeting> {
  const response = await fetch(
    "https://graph.microsoft.com/v1.0/me/onlineMeetings",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        subject,
        startDateTime,
        endDateTime,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create Teams meeting: ${response.status} ${error}`);
  }

  return await response.json();
}

/**
 * Get or create a chat with self (for sending reminders)
 * Uses a simpler approach that works with current permissions
 */
async function getOrCreateSelfChat(accessToken: string): Promise<string> {
  try {
    // Try to get existing chats first
    const chatsResponse = await fetch(
      "https://graph.microsoft.com/v1.0/me/chats?$filter=chatType eq 'oneOnOne'",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (chatsResponse.ok) {
      const chats = await chatsResponse.json();
      
      // Get user's own ID to find self-chat
      const userResponse = await fetch("https://graph.microsoft.com/v1.0/me", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (userResponse.ok) {
        const user = await userResponse.json();
        const userId = user.id;

        // Look for a chat where we're the only member
        for (const chat of chats.value) {
          // Get chat members
          const membersResponse = await fetch(
            `https://graph.microsoft.com/v1.0/chats/${chat.id}/members`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );

          if (membersResponse.ok) {
            const members = await membersResponse.json();
            // If only one member and it's us, this is a self-chat
            if (members.value.length === 1 && members.value[0].userId === userId) {
              return chat.id;
            }
          }
        }
      }
    }

    // If no self-chat found, create one
    const userResponse = await fetch("https://graph.microsoft.com/v1.0/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!userResponse.ok) {
      throw new Error("Failed to get user profile");
    }

    const user = await userResponse.json();
    const userId = user.id;

    const chatResponse = await fetch(
      "https://graph.microsoft.com/v1.0/chats",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chatType: "oneOnOne",
          members: [
            {
              "@odata.type": "#microsoft.graph.aadUserConversationMember",
              roles: ["owner"],
              "user@odata.bind": `https://graph.microsoft.com/v1.0/users('${userId}')`,
            },
          ],
        }),
      }
    );

    if (!chatResponse.ok) {
      const error = await chatResponse.text();
      throw new Error(`Failed to create self chat: ${chatResponse.status} ${error}`);
    }

    const chat = await chatResponse.json();
    return chat.id;
  } catch (error) {
    console.error("Error in getOrCreateSelfChat:", error);
    throw error;
  }
}

/**
 * Build an Adaptive Card for study session reminder
 */
export function buildStudyReminderCard(
  assessmentTitle: string,
  startTime: string,
  endTime: string,
  dueDate?: string
): AdaptiveCard {
  const startDate = new Date(startTime);
  const endDate = new Date(endTime);
  
  const timeString = `${startDate.toLocaleTimeString("en-PH", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })} - ${endDate.toLocaleTimeString("en-PH", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })}`;

  const dateString = startDate.toLocaleDateString("en-PH", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return {
    type: "AdaptiveCard",
    version: "1.4",
    body: [
      {
        type: "Container",
        style: "emphasis",
        items: [
          {
            type: "ColumnSet",
            columns: [
              {
                type: "Column",
                width: "auto",
                items: [
                  {
                    type: "Image",
                    url: "https://img.icons8.com/fluency/48/book.png",
                    size: "Small",
                  },
                ],
              },
              {
                type: "Column",
                width: "stretch",
                items: [
                  {
                    type: "TextBlock",
                    text: "📚 Study Session Reminder",
                    weight: "Bolder",
                    size: "Medium",
                    color: "Accent",
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        type: "Container",
        items: [
          {
            type: "TextBlock",
            text: assessmentTitle,
            weight: "Bolder",
            size: "Large",
            wrap: true,
          },
          {
            type: "FactSet",
            facts: [
              {
                title: "📅 Date:",
                value: dateString,
              },
              {
                title: "⏰ Time:",
                value: timeString,
              },
              ...(dueDate
                ? [
                    {
                      title: "📌 Due:",
                      value: new Date(dueDate).toLocaleDateString("en-PH", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      }),
                    },
                  ]
                : []),
            ],
          },
          {
            type: "TextBlock",
            text: "Your study session is coming up soon. Good luck! 🎓",
            wrap: true,
            spacing: "Medium",
          },
        ],
      },
    ],
    actions: [
      {
        type: "Action.OpenUrl",
        title: "Open Mate",
        url: process.env.NEXTAUTH_URL || "http://localhost:3000",
      },
    ],
  };
}

/**
 * Build an Adaptive Card for deadline conflict alert
 */
export function buildConflictAlertCard(
  conflictWeek: string,
  assessments: string[],
  severity: "high" | "medium" | "low"
): AdaptiveCard {
  const severityColor = {
    high: "Attention",
    medium: "Warning",
    low: "Good",
  }[severity];

  const severityEmoji = {
    high: "🚨",
    medium: "⚠️",
    low: "ℹ️",
  }[severity];

  return {
    type: "AdaptiveCard",
    version: "1.4",
    body: [
      {
        type: "Container",
        style: "emphasis",
        items: [
          {
            type: "TextBlock",
            text: `${severityEmoji} Deadline Conflict Detected`,
            weight: "Bolder",
            size: "Medium",
            color: severityColor,
          },
        ],
      },
      {
        type: "Container",
        items: [
          {
            type: "TextBlock",
            text: `Week of ${conflictWeek}`,
            weight: "Bolder",
            size: "Large",
            wrap: true,
          },
          {
            type: "TextBlock",
            text: `You have ${assessments.length} major assessments due this week:`,
            wrap: true,
            spacing: "Small",
          },
          ...assessments.map((assessment) => ({
            type: "TextBlock",
            text: `• ${assessment}`,
            wrap: true,
            spacing: "None",
          })),
          {
            type: "TextBlock",
            text: "Consider starting early or adjusting your study schedule.",
            wrap: true,
            spacing: "Medium",
            isSubtle: true,
          },
        ],
      },
    ],
    actions: [
      {
        type: "Action.OpenUrl",
        title: "View Schedule",
        url: `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/dashboard`,
      },
    ],
  };
}
