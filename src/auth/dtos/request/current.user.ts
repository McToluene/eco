export default interface CurrentUser {
  username: string;
  lgaId: string;
  stateIds: string[];
  hasStateBasedAccess: boolean;
  assignedPollingUnits: any[];
  userId: string;
  userType: string;
}
