import { WebSocket } from "ws";
import type { DomainEvent } from "@v01/core";

class RealtimeHub {
  private readonly clients = new Set<WebSocket>();

  attach(socket: WebSocket): void {
    this.clients.add(socket);
    socket.on("close", () => {
      this.clients.delete(socket);
    });
  }

  publish(event: DomainEvent): void {
    const payload = JSON.stringify(event);
    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    }
  }
}

export const realtimeHub = new RealtimeHub();

