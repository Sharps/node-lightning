import { ShortChannelId } from "@lntools/wire";
import BN = require("bn.js");
import { ChannelSettings } from "./channel-settings";
import { OutPoint } from "./outpoint";

/**
 * @typedef {import("@lntools/wire").ShortChannelId} ShortChannelId
 * @typedef {import("@lntools/wire").ChannelAnnouncementMessage} ChannelAnnouncementMessage
 * @typedef {import("./channel-settings").ChannelSettings} ChannelSettings
 * @typedef {import("./outpoint").OutPoint} OutPoint
 * @typedef {import("bn.js")} BN
 */

export class Channel {
  public chainHash: Buffer;
  public shortChannelId: ShortChannelId;

  /**
   * Obtained after verifying the transaction is a valid
   * channel funding transaction and is still a UTXO
   */
  public channelPoint: OutPoint;

  public node1Settings: ChannelSettings;
  public node2Settings: ChannelSettings;
  public nodeId1: Buffer;
  public nodeId2: Buffer;
  public bitcoinKey1: Buffer;
  public bitcoinKey2: Buffer;
  public nodeSignature1: Buffer;
  public nodeSignature2: Buffer;
  public bitcoinSignature1: Buffer;
  public bitcoinSignature2: Buffer;
  public features: BN;
  public lastUpdate: number;
  public capacity: BN;

  /**
   * Routable when nodes are known and validated and at least one
   * node has broadcast its relay fees
   */
  get isRoutable(): boolean {
    return !!this.nodeId1 && !!this.nodeId2 && !!(this.node1Settings || this.node2Settings);
  }

  /**
   * Update channel settings
   */
  public updateSettings(settings: ChannelSettings): boolean {
    if (settings.direction === 0) {
      if (this.node1Settings && this.node1Settings.timestamp > settings.timestamp) {
        return false;
      }
      this.node1Settings = settings;
      return true;
    } else {
      if (this.node2Settings && this.node2Settings.timestamp > settings.timestamp) {
        return false;
      }
      this.node2Settings = settings;
      return true;
    }
  }

  public toJSON() {
    const c = this;
    return {
      shortChannelId: c.shortChannelId.toString(),
      channelPoint: c.channelPoint.toString(),
      nodeId1: c.nodeId1.toString("hex"),
      nodeId2: c.nodeId2.toString("hex"),
      bitcoinKey1: c.bitcoinKey1.toString("hex"),
      bitcoinKey2: c.bitcoinKey2.toString("hex"),
      nodeSignature1: c.nodeSignature1.toString("hex"),
      nodeSignature2: c.nodeSignature2.toString("hex"),
      bitcoinSignature1: c.bitcoinSignature1.toString("hex"),
      bitcoinSignature2: c.bitcoinSignature2.toString("hex"),
      features: c.features.toString(10),
      capacity: c.capacity.toString(10),
      node1Settings: c.node1Settings,
      node2Settings: c.node2Settings,
    };
  }
}