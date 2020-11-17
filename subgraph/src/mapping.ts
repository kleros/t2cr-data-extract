import { log, BigInt } from "@graphprotocol/graph-ts";
import { ArbitrableTokenList, RequestSubmitted, TokenStatusChange } from "../generated/ArbitrableTokenList/ArbitrableTokenList";
import { Request, Token } from "../generated/schema";


const PENDING = 'Pending'
const ACCEPTED = 'Accepted'
const REJECTED = 'Rejected'

const REGISTRATION = 'Registration'
const REMOVAL = 'Removal'

export function handleRequestSubmitted(event: RequestSubmitted): void {
  let token = Token.load(event.params._tokenID.toHexString())
  let numberOfRequests = BigInt.fromI32(1)
  if (token == null) {
    token = new Token(event.params._tokenID.toHexString())
    token.numberOfRequests = BigInt.fromI32(1)
  } else {
    token.numberOfRequests = token.numberOfRequests.plus(BigInt.fromI32(1))
  }
  token.save()

  let id = event.params._tokenID.toHexString()+'-'+numberOfRequests.minus(BigInt.fromI32(1)).toString()
  let request = new Request(id)

  request.timestamp = event.block.timestamp
  request.result = PENDING
  request.type = event.params._registrationRequest
    ? REGISTRATION
    : REMOVAL
  request.requester = event.transaction.from

  request.resolutionTime = BigInt.fromI32(0)
  request.save()
}

export function handleTokenStatusChange(event: TokenStatusChange): void {
  if (event.params._status !== 0 || event.params._status !== 1) {
    return // Request not yet resolved. Noop.
  }

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