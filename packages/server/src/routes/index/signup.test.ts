import config from '../../config';
import { NotificationKey } from '../../models/NotificationModel';
import { AccountType } from '../../models/UserModel';
import { MB } from '../../utils/bytes';
import { execRequestC } from '../../utils/testing/apiUtils';
import { beforeAllDb, afterAllTests, beforeEachDb, models } from '../../utils/testing/testUtils';
import { FormUser } from './signup';

describe('index_signup', function() {

	beforeAll(async () => {
		await beforeAllDb('index_signup');
	});

	afterAll(async () => {
		await afterAllTests();
	});

	beforeEach(async () => {
		await beforeEachDb();
	});

	test('should create a new account', async function() {
		const formUser: FormUser = {
			full_name: 'Toto',
			email: 'toto@example.com',
			password: 'testing',
			password2: 'testing',
		};

		// First confirm that it doesn't work if sign up is disabled
		{
			config().signupEnabled = false;
			await execRequestC('', 'POST', 'signup', formUser);
			expect(await models().user().loadByEmail('toto@example.com')).toBeFalsy();
		}

		config().signupEnabled = true;
		const context = await execRequestC('', 'POST', 'signup', formUser);

		// Check that the user has been created
		const user = await models().user().loadByEmail('toto@example.com');
		expect(user).toBeTruthy();
		expect(user.account_type).toBe(AccountType.Basic);
		expect(user.email_confirmed).toBe(0);
		expect(user.can_share_folder).toBe(0);
		expect(user.max_item_size).toBe(10 * MB);

		// Check that the user is logged in
		const session = await models().session().load(context.cookies.get('sessionId'));
		expect(session.user_id).toBe(user.id);

		// Check that the notification has been created
		const notifications = await models().notification().allUnreadByUserId(user.id);
		expect(notifications.length).toBe(1);
		expect(notifications[0].key).toBe(NotificationKey.ConfirmEmail);
	});

});