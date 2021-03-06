import { DbIdType, RelationIdType, LogicalTimestep } from "../parser/dielAstTypes";
import { DbSetupConfig } from "./DbEngine";

export interface DielConfig {
  dielFiles: string[];
  setupCb: () => void;
  showLog?: boolean;
  isStrict?: boolean;
  mainDbPath?: string;
  dbConfigs?: DbSetupConfig[];
}

export type GetRelationToShipFuncType = (dbId: DbIdType, relation: string, step: LogicalTimestep) => Set<string>;

export type RecordObject = {[index: string]: string | number | Uint8Array};
export type RelationObject = RecordObject[];

export enum DbType {
  Local = "Local",
  Worker = "Worker",
  Socket = "Socket"
}

// TODO: add more runtime info
// e.g., number of times accessed etc.
export interface TableMetaData {
  dbId: DbIdType;
}

export enum DielRemoteAction {
  ConnectToDb = "ConnectToDb",
  GetResultsByPromise = "GetResultsByPromise",
  DefineRelations = "DefineRelations",
  UpdateRelation = "UpdateRelation",
  ShipRelation = "ShipRelation",
}

export interface DielRemoteMessageId {
  remoteAction: DielRemoteAction;
  relationName?: RelationIdType;
  msgId?: number; // currently only used for fullfilling promises.
  lineage?: number;
}
export interface DielRemoteReply {
  id: DielRemoteMessageId;
  results: RelationObject;
  err: any;
}

interface DielRemoteMessageBase {
  remoteAction: DielRemoteAction;
  lineage: LogicalTimestep;
  msgId?: number;
}

export interface RemoteGetResultsByPromiseMessage extends RemoteExecuteMessage {
  msgId: number;
}

export interface RemoteShipRelationMessage extends DielRemoteMessageBase {
  relationName: RelationIdType;
  dbId: DbIdType;
}

export interface RemoteOpenDbMessage extends DielRemoteMessageBase {
  message?: string;     // for socket
  buffer?: Uint8Array; // for worker
}

export interface RemoteUpdateRelationMessage extends RemoteExecuteMessage {
  relationName: RelationIdType; // redundancy
}

export interface RemoteExecuteMessage extends DielRemoteMessageBase {
  sql: string;
}

export type DielRemoteMessage = RemoteGetResultsByPromiseMessage
                                | RemoteShipRelationMessage
                                | RemoteUpdateRelationMessage
                                | RemoteOpenDbMessage
                                ;