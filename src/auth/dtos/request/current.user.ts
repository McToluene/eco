export default interface CurrentUser {
  username: string;
  lgaId: string;
  stateIds: string[];
  assignedPollingUnits: any[];
  userId: string;
  userType: string;
}
