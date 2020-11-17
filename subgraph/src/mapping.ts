import { log } from "@graphprotocol/graph-ts";
import { ArbitrableTokenList, RequestSubmitted, TokenStatusChange } from "../generated/ArbitrableTokenList/ArbitrableTokenList";
import { Request } from "../generated/schema";


const PENDING = 'PENDING'
const ACCEPTED = 'ACCEPTED'
const REJECTED = 'REJECTED'

const REGISTRATION = 'REGISTRATION'
const REMOVAL = 'REMOVAL'

export function handleRequestSubmitted(event: RequestSubmitted): void {
  let tcr = ArbitrableTokenList.bind(event.address)
  let tokenInfo = tcr.getTokenInfo(event.params._tokenID)
  let numberOfRequests = tokenInfo.value5
  let id = event.params._tokenID.toHexString()+'-'+numberOfRequests.toString()
  let request = new Request(id)

  request.timestamp = event.block.timestamp
  request.result = PENDING
  request.type = event.params._registrationRequest
    ? REGISTRATION
    : REMOVAL
  request.requester = event.transaction.from

  request.save()
}

export function handleTokenStatusChange(event: TokenStatusChange): void {
  if (event.params._status !== 0 || event.params._status !== 1)
    return


  let tcr = ArbitrableTokenList.bind(event.address)
  let tokenInfo = tcr.getTokenInfo(event.params._tokenID)
  let numberOfRequests = tokenInfo.value5
  let id = event.params._tokenID.toHexString()+'-'+numberOfRequests.toString()

  let request = Request.load(id)
  if (request == null) {
    log.error('T2CR: Request {} not found. Bailing handleTokenStatusChange.',[id])
  }

  request.resolutionTime = event.block.timestamp;
  if (request.type === REGISTRATION) {
    if (event.params._status === 0) request.result = REJECTED
    else request.result = ACCEPTED
  } else {
    if (event.params._status === 0) request.result = ACCEPTED
    else request.result = REJECTED
  }

  request.save()
}