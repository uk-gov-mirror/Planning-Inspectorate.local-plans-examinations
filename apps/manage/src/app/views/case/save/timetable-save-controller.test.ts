import { TimetableSaveController } from './timetable-save-controller.ts';
import { ManageService } from '#service';
import type { Request } from 'express';
import { describe, it, type Mock, mock } from 'node:test';
import assert from 'node:assert/strict';

type MockServiceType = {
	db: {
		case: {
			findUnique: any;
			upsert: any;
		};
		gateway1Info: {
			findUnique: any;
			upsert: any;
		};
		gateway2Info: {
			findUnique: any;
			upsert: any;
		};
		gateway3Info: {
			findUnique: any;
			upsert: any;
		};
		examinationInfo: {
			findUnique: any;
			upsert: any;
		};
		contacts: {
			upsert: any;
		};
		lpas: {
			upsert: any;
		};
		gateway3Submission: {
			updateMany: any;
		};
		planPauseHistory: {
			update: any;
		};
	};
};
function createMockService(): MockServiceType {
	return {
		db: {
			case: {
				findUnique: mock.fn(async () => ({
					id: 'someCaseId',
					gateway2Info: {
						workshops: [{}]
					},
					examinationInfo: {
						hearings: [{}]
					},
					gateway3Info: {
						submissions: [
							{
								id: 'someId',
								decision: undefined,
								completionDate: undefined,
								gateway3InfoId: undefined
							}
						]
					}
				})),
				upsert: mock.fn(async () => ({}))
			},
			gateway1Info: {
				findUnique: mock.fn<() => {}>(),
				upsert: mock.fn(async () => ({}))
			},
			gateway2Info: {
				findUnique: mock.fn<() => {}>(),
				upsert: mock.fn(async () => ({}))
			},
			gateway3Info: {
				findUnique: mock.fn<() => {}>(),
				upsert: mock.fn(async () => ({}))
			},
			examinationInfo: {
				findUnique: mock.fn<() => {}>(),
				upsert: mock.fn(async () => ({}))
			},
			contacts: {
				upsert: mock.fn(async () => ({}))
			},
			lpas: {
				upsert: mock.fn(async () => ({}))
			},
			gateway3Submission: {
				updateMany: mock.fn(async () => ({ count: 1 }))
			},
			planPauseHistory: {
				update: mock.fn(async () => ({}))
			}
		}
	};
}

const mockDate = new Date('2026-01-01T00:00:00.000Z');
mock.timers.enable({
	apis: ['Date'],
	now: mockDate
});

function createController(mockService: MockServiceType, question: string) {
	const req = {
		params: {},
		url: `/timetable/fact-check/${question}`
	} as Request;
	req.params.question = question;
	return new TimetableSaveController(mockService as unknown as ManageService, req, 'caseRef');
}

describe('test TimetableSaveController', () => {
	it('saves a gateway 1 question to Gateway1Info', async () => {
		const mockService = createMockService();
		const answers = { expectedGateway1Date: mockDate };
		const expectedQuery = {
			where: { caseId: 'someCaseId' },
			update: { ...answers },
			create: {
				caseId: 'someCaseId',
				...answers
			}
		};
		await createController(mockService, 'expected-gateway-1-date').prepareAndSave(answers);
		assert.deepEqual(mockService.db.gateway1Info.upsert.mock.calls[0].arguments.at(0), expectedQuery);
		assert.equal(mockService.db.gateway2Info.upsert.mock.callCount(), 0);
		assert.equal(mockService.db.gateway3Info.upsert.mock.callCount(), 0);
		assert.equal(mockService.db.examinationInfo.upsert.mock.callCount(), 0);
	});
	it('saves a gateway 2 question to Gateway2Info', async () => {
		const mockService = createMockService();
		const answers = { expectedDate: mockDate };
		await createController(mockService, 'gateway-2-expected-date').prepareAndSave(answers);
		assert.equal(mockService.db.gateway2Info.upsert.mock.callCount(), 1);
		assert.equal(mockService.db.gateway2Info.upsert.mock.calls[0].arguments.at(0).update.expectedDate, mockDate);
		assert.equal(mockService.db.gateway1Info.upsert.mock.callCount(), 0);
		assert.equal(mockService.db.gateway3Info.upsert.mock.callCount(), 0);
	});
	it('maps the timetable gateway 3 dates to the Gateway3Info field names', async () => {
		const mockService = createMockService();
		const actualDate = new Date('2026-02-02T00:00:00.000Z');
		const answers = { gateway3ExpectedDate: mockDate, gateway3ActualDate: actualDate };
		const expectedQuery = {
			where: { caseId: 'someCaseId' },
			update: { expectedDate: mockDate, actualDate },
			create: {
				caseId: 'someCaseId',
				expectedDate: mockDate,
				actualDate
			}
		};
		await createController(mockService, 'gateway-3-expected-date').prepareAndSave(answers);
		assert.deepEqual(mockService.db.gateway3Info.upsert.mock.calls[0].arguments.at(0), expectedQuery);
		assert.equal(mockService.db.gateway2Info.upsert.mock.callCount(), 0);
	});
	it('only maps the gateway 3 dates that are present', async () => {
		const mockService = createMockService();
		const answers = { gateway3ActualDate: mockDate };
		await createController(mockService, 'gateway-3-actual-date').prepareAndSave(answers);
		assert.deepEqual(mockService.db.gateway3Info.upsert.mock.calls[0].arguments.at(0).update, {
			actualDate: mockDate
		});
	});
	it('saves an examination question to ExaminationInfo', async () => {
		const mockService = createMockService();
		const answers = { letterIssueDate: mockDate };
		await createController(mockService, 'letter-issue-date').prepareAndSave(answers);
		assert.equal(mockService.db.examinationInfo.upsert.mock.callCount(), 1);
		assert.equal(mockService.db.examinationInfo.upsert.mock.calls[0].arguments.at(0).update.letterIssueDate, mockDate);
		assert.equal(mockService.db.gateway1Info.upsert.mock.callCount(), 0);
	});
	for (const { type, fieldName } of [
		{ type: 'start', fieldName: 'planPauseDate' },
		{ type: 'end', fieldName: 'planPauseEndDate' }
	]) {
		for (const pauseNumber of [1, 2]) {
			it(`updates the ${type} date of pause ${pauseNumber} directly in the database`, async () => {
				const mockService = createMockService();
				const updatedDate = new Date('2026-02-05T00:00:00.000Z');
				const pauses = [
					{ id: 'pause-2', createdAt: new Date('2026-01-02T00:00:00.000Z') },
					{ id: 'pause-1', createdAt: new Date('2026-01-01T00:00:00.000Z') }
				];
				mockService.db.case.findUnique = mock.fn(async () => ({
					examinationInfo: { planPauseHistory: pauses }
				}));

				const result = await createController(
					mockService,
					`examination-pause-${type}-date-${pauseNumber}`
				).prepareAndSave({ [`${fieldName}-${pauseNumber}`]: updatedDate });

				assert.deepEqual(result, { dataWritten: true, writtenToDB: true });
				assert.deepEqual(mockService.db.planPauseHistory.update.mock.calls[0].arguments.at(0), {
					where: { id: `pause-${pauseNumber}` },
					data: { [fieldName]: updatedDate }
				});
			});
		}
	}
	it('does not save anything when the question is not a timetable question', async () => {
		const mockService = createMockService();
		await createController(mockService, 'a-different-question').prepareAndSave({ a: 'b' });
		assert.equal(mockService.db.gateway1Info.upsert.mock.callCount(), 0);
		assert.equal(mockService.db.gateway2Info.upsert.mock.callCount(), 0);
		assert.equal(mockService.db.gateway3Info.upsert.mock.callCount(), 0);
		assert.equal(mockService.db.examinationInfo.upsert.mock.callCount(), 0);
	});
	it('updates the completion date of the proceed to examination submission', async () => {
		const mockService = createMockService();
		const answers = { gateway3CompletionDate: mockDate };
		const expectedQuery = {
			where: { gateway3Info: { caseId: 'someCaseId' }, decision: '1' },
			data: { completionDate: mockDate }
		};
		const result = await createController(mockService, 'timetable-gateway-3-completion-date').prepareAndSave(answers);
		assert.deepEqual(mockService.db.gateway3Submission.updateMany.mock.calls[0].arguments.at(0), expectedQuery);
		assert.deepEqual(result, { dataWritten: true, writtenToDB: true });
		assert.equal(mockService.db.gateway3Info.upsert.mock.callCount(), 0);
	});
	it('throws when the case cannot be found for the completion date', async () => {
		const mockService = createMockService();
		mockService.db.case.findUnique = mock.fn(async () => null as any);
		await assert.rejects(
			() =>
				createController(mockService, 'timetable-gateway-3-completion-date').prepareAndSave({
					gateway3CompletionDate: mockDate
				}),
			/Case not found/
		);
		assert.equal(mockService.db.gateway3Submission.updateMany.mock.callCount(), 0);
	});
});
